const config = require('./config.json');
const utils = require('./utils');
const fetch = require('node-fetch');
const bridge = require('@splinterlands/external-bridge');

start()

async function start() {
	bridge.init(config);

	for (let i = 0; i < config.accounts.length; i++) {
		await transferAssets(config.accounts[i]);
	}
}

async function transferAssets(account) {
	utils.log(`Transferring assets from [@${account.name}] to [@${config.receiving_account}]...`);

	try {
		const result = await fetch(`${config.game_api_url}/players/balances?username=${account.name}`);
		let balances = await result.json();

		// Filter out any 0 balances
		balances = balances.filter(b => config.tokens.includes(b.token) && b.balance > 0);

		if (!balances || balances.length === 0) {
			utils.log(`No token balances found for [@${account.name}].`);
		} else {
			for (let i = 0; i < config.tokens.length; i++) {
				const token = config.tokens[i];
				const balance = balances.find(b => b.token === token);

				if (balance) {
					utils.log(`Transferring [${balance.balance} ${token}]...`);
					await bridge.sendToken(config.receiving_account, token, balance.balance, account.name, account.key);
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

			await bridge.customJson(`${config.prefix}gift_cards`, {
				to: config.receiving_account,
				cards: cards_to_send.map(c => c.uid),
			}, account.name, account.key, true);
		}
	} catch (err) {
		utils.log(`Error transferring assets for [@${account.name}]. Error: ${err && err.message ? err.message : err}`, 1, 'Red');
		console.log(err.stack);
	}
}