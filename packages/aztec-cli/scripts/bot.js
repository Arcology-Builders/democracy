#!/usr/bin/env node
'use strict';
const { mint } = require('../src/mint');
const { Map } = require('immutable');
const BN = require('bn.js');
const { wallet } = require('demo-keys');
const { getConfig, getNetwork } = require('demo-utils');
const { toWei } = require('web3-utils');

const { CommandLineClient, decryptHexString } = require('darkchat');

class DarkBotClient extends CommandLineClient {
	constructor() {
		super({
			host: 'capetown.arcology.nyc',
			port: 8545,
		});
		this.requests = 0;
		this.lock = 0;
	}

	// Call start() after instantiating it
	async start() {
		// Add CLI TCP socket specific client logger and connection logic
		this.init();
		this.client.connect(this.port, this.host, () => {
			console.log(`Client connected to: ${this.host}:${this.port}`);
		});

		this.eth = await getNetwork();

		return new Promise((resolve, reject) => {
			this.client.on('connect', () => {
				this.constructAndSendMessage('connect');
				resolve();
			});
		});
	}
}

const c = new DarkBotClient();

c.addMessageListener(async (_data) => {
	const data = JSON.parse(_data.toString());
	if (data.type === 'verify') {
		const msg = Buffer.from(data['msg']).toString();
		c.constructAndSendMessage('verify', c.genSignature(msg));
	} else if (data.type === 'success') {
		console.log(`${msg}`);
	} else if (data.type === 'msg' && data['toPublicKey']) {
		//Decryption
		const sharedKey = c.getSharedKeyAsBuffer(data['fromPublicKey']).slice(1);
		const decrypted_msg = decryptHexString({ encryptedHexString: data['msg'], key: sharedKey });
		data['msg'] = JSON.parse(decrypted_msg)['msg'];

		if (!data.msg) {
			console.log('Received empty message' + JSON.stringify(data));
		} else if (data.msg.startsWith('mint')) {
			const requestNum = this.requests;
			this.requests += 1;
			const tokens = data.msg.split(' ');
			const result = await mintFromMessage({
				tradeSymbol: tokens[1],
				mintAmount: new BN(tokens[2]),
				minteeAddress: tokens[3],
				minteePublicKey: tokens[4],
			});
			const { minteeNoteHash } = result.toJS();
			c.c.constructAndSendMessage(
				'msg',
				JSON.stringify({
					minteeNoteHash,
					requestNum,
					timestamp: Date.now(),
				}).toString(),
				data['fromPublicKey']
			);
		} else if (data.msg.startsWith('topup')) {
			const requestNum = this.requests;
			this.requests += 1;
			const tokens = data.msg.split(' ');
			const payeeAddress = tokens[1];
			const balance = new BN(await c.eth.getBalance(payeeAddress));
			const result = await topUpFromMessage({
				balance,
				payeeAddress,
			});
			const { txHash } = result.toJS();
			c.constructAndSendMessage(
				'msg',
				JSON.stringify({
					txNoteHash,
					requestNum,
					timestamp: Date.now(),
				}).toString(),
				data['fromPublicKey']
			);
		}
	}
});

const mintFromMessage = async ({ minteeAddress, minteePublicKey, mintFromZero = false, mintAmount, tradeSymbol }) => {
	console.log(`Address   : ${minteeAddress}`);
	console.log(`Public Key: ${minteePublicKey}`);

	const config = getConfig();
	const deployerAddress = config['DEPLOYER_ADDRESS'];
	const deployerPassword = config['DEPLOYER_PASSWORD'];

	const result = await mint(
		Map({
			tradeSymbol: tradeSymbol || 'AAA',
			minteeAddress: minteeAddress,
			minteePublicKey: minteePublicKey,
			deployerAddress: deployerAddress,
			deployerPassword: deployerPassword,
			minteeAmount: mintAmount || new BN(0),
			mintFromZero: mintFromZero,
		})
	);

	console.log('minteeNoteHash', result.get('minteeNoteHash'));
	console.log('Minting complete.');
	wallet.shutdownSync();
	return result;
};

const PAY_AMOUNT = new BN(toWei('0.1', 'ether'));

const topUpFromMessage = async ({ payeeAddress, balance }) => {
	console.log(`Address   : ${minteeAddress}`);
	console.log(`Public Key: ${minteePublicKey}`);

	const config = getConfig();
	const deployerAddress = config['DEPLOYER_ADDRESS'];
	const deployerPassword = config['DEPLOYER_PASSWORD'];

	if (balance.lt(limit)) {
		const { signerEth } = await wallet.prepareSigner({
			deployerAddress,
			deployerPassword,
		});

		await wallet.init();

		const result = await wallet.pay({
			minteeAddress: minteeAddress,
			minteePublicKey: minteePublicKey,
			fromAddress: deployerAddress,
			toAddress: payeeAddress,
			payAmount: PAY_AMOUNT,
			deployerPassword: deployerPassword,
			minteeAmount: mintAmount || new BN(0),
			mintFromZero: mintFromZero,
		});

		console.log('minteeNoteHash', result.get('minteeNoteHash'));
		console.log('Minting complete.');
		wallet.shutdownSync();
		return result;
	} else {
		return Map({});
	}
};

const main = async () => {
	await c.start();
	await new Promise((resolve, reject) => {
		setTimeout(async () => {
			c.uname = 'darkbot';
			c.channel = 'zktransfer';
			await c.constructAndSendMessage('join', '');
			await c.constructAndSendMessage('msg', 'DARKBOT LIVES');
			resolve();
		}, 1000);
	});
};

main().then(() => console.log('Exited'));
