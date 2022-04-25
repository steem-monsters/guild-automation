const fs = require('fs');
const config = require('./config.json');
const utils = require('./utils');
const fetch = require('node-fetch');
const bridge = require('@splinterlands/external-bridge');

start()

async function start() {
	bridge.init(config);

	const fileName = getFileName();
	for (let i = 0; i < config.accounts.length; i++) {
		await transferAssets(config.accounts[i], fileName);
	}

	if (config.run_interval_minutes) {
		setTimeout(start, config.run_interval_minutes * 60 * 1000);
	}
}

async function transferAssets(account, fileName) {
	utils.log(`Transferring assets from [@${account.name}] to [@${config.receiving_account}]...`);

	try {
		let csv = `${account.name}`;
		const result = await fetch(`${config.game_api_url}/players/balances?username=${account.name}`);
		let balances = await result.json();

		// Filter out any 0 balances
		balances = balances.filter(b => config.tokens.includes(b.token) && b.balance > 0);

		if (!balances || balances.length === 0) {
			utils.log(`No token balances found for [@${account.name}].`);
		} else {
			for (let i = 0; i < config.tokens.length; i++) {
				const token = config.tokens[i];
				csv += `,${token}`;
				const balance = balances.find(b => b.token === token);

				if (balance) {
					utils.log(`Transferring [${balance.balance} ${token}]...`);
					const token_tx = await bridge.sendToken(config.receiving_account, token, balance.balance, account.name, account.key);
					csv += `,${balance.balance},${token_tx.id}`;
				} else {
					csv += `,0,`;
				}
			}
		}

		const card_api_result = await fetch(`${config.game_api_url}/cards/collection/${account.name}`);
		const cards = await card_api_result.json();
		const cards_to_send = cards && cards.cards ? cards.cards.filter(c => config.card_editions.includes(c.edition)) : [];

		if (cards_to_send.length === 0) {
			utils.log(`No cards found for [@${account.name}].`);
		} else {
			utils.log(`Transferring ${cards_to_send.length} cards...`);

			const card_tx = await bridge.customJson(`${config.prefix}gift_cards`, {
				to: config.receiving_account,
				cards: cards_to_send.map(c => c.uid),
			}, account.name, account.key, true);

			csv += `,"${cards_to_send.map(c => c.uid).join(',')}",${card_tx.id}`;
		}

		if (config.output_file_path) {
			fs.appendFile(`${config.output_file_path}/${fileName}`, `${csv}\r\n`, err => err ? utils.log(`Error writing to file: ${err}`) : null);
		}
	} catch (err) {
		utils.log(`Error transferring assets for [@${account.name}]. Error: ${err && err.message ? err.message : err}`, 1, 'Red');
		console.log(err.stack);
	}
}

function getFileName() {
	let dateStr = new Date().toISOString();
	return `guild_transfers_${dateStr.substr(0, dateStr.indexOf('.')).replace(/:/g,'.')}.csv`;
}