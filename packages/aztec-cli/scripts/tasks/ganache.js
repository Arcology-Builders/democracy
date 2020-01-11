import cp from 'child_process';
import Web3 from 'web3';
import config from '../../ganache.config';
import '../envConfig';
import {
  log,
  successLog,
  errorLog,
} from '../utils/log';

let web3;

const getPort = () => {
  let {
    port,
  } = config;
  const argsConfig = process.argv.find(val => val.match(/^--port=[0-9]+$/));
  if (argsConfig) {
    [, port] = argsConfig.split('=');
  }

  return port;
};

const generateAccounts = () => {
  const accounts = [];
  const {
    numberOfAccounts,
    defaultBalanceEther,
  } = config;
  for (let i = 0; i < numberOfAccounts; i += 1) {
    let address;
    let privateKey = process.env[`GANACHE_TESTING_ACCOUNT_${i}`];
    if (privateKey) {
      ({ address } = web3.eth.accounts.privateKeyToAccount(privateKey));
    } else {
      ({
        address,
        privateKey,
      } = web3.eth.accounts.create());
    }
    const balance = web3.utils.toWei(
      `${process.env[`GANACHE_TESTING_ACCOUNT_${i}_BALANCE`] || defaultBalanceEther}`,
      'ether',
    );

    accounts.push({
      address,
      privateKey,
      balance,
    });
  }
  return accounts;
};

async function ganache() {
  await new Promise((resolve) => {
    const {
      host = 'localhost',
    } = config;

    const port = getPort();
    const provider = new Web3.providers.HttpProvider(`http://${host}:${port}`);
    web3 = new Web3(provider);

    const params = [];
    const accounts = generateAccounts();
    accounts.forEach(({
      privateKey,
      balance,
    }) => {
      params.push(`--account=${privateKey},${balance}`);
    });

    const instance = cp.spawn(
      'ganache-cli',
      [
        '-p',
        port,
        ...params,
      ],
      {
        windowsVerbatimArguments: true,
      },
    );

    instance.stdout.on('data', (data) => {
      process.stdout.write(data.toString('utf8'));
    });

    instance.stderr.on('data', (data) => {
      log(`stderr:\n ${data}`);
    });

    instance.on('error', (error) => {
      errorLog(error);
    });

    instance.on('close', (code) => {
      if (code === 0) {
        successLog('Ganache instance cleard');
      } else {
        log(`Child process exited with code ${code}`);
      }

      return resolve();
    });
  });
}

export default ganache;
