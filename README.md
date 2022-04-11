# Splinterlands Guild Automation Tool

This tool will automatically transfer all liquid DEC, SPS, and Reward Edition cards from a specified list of accounts to one master (guild) account. It can be set up to automatically run on a set interval via a cron job or other scheduling tool.

## Setup Instructions

1. Clone the github repo from https://github.com/steem-monsters/guild-automation.git
2. Open the folder to which the repo was cloned and run `npm i` to install packages
3. Copy `config-example.json` to `config.json`
4. Update `receiving_account` and the `accounts` list in `config.json` with the details for the master account and the player accounts
5. Run the script using `node index.js`

You can use a cron job or other scheduling tool to set the script to run on regular intervals.

