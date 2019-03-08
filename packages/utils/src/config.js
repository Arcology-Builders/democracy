// Environment-controlled configuration to choose network and deploy parameters

const Logger = require('./logger')
const logger = new Logger('config', ['info','debug','error'])

const createEnv = ({ url, gp, db }) => {
  return {
    'ENDPOINT_URL': url,
    'DB_NAMESPACE': db,
    'GAS_PRICE'   : gp,
  }
}

const checkEnv = (config, vars) => {
  vars.forEach((v) => {
    if (process.env[v]) {
      logger.errorAndThrow(`Environment variable ${v} needed but not defined.`)
    }
  })
  return config
}

const ENVIRONMENTS = {
  'DEVELOPMENT': createEnv({
    'url': "http://localhost:8545",
    'gp' : 5,
    'db' : 'dev',
  }),
  'TEST'       : createEnv({
    'url': 'http://ganache.arcology.nyc:8545',
    'gp' : 5,
    'db' : 'test',
  }),
  'RINKEBY'    : checkEnv(createEnv({
    'url': `https://rinkeby.infura.io/${process.env.INFURA_PROJECT_ID}`,
    'gp' : 5,
    'db' : 'rinkeby',
  }), ['INFURA_PROJECT_ID']),
  'MAINNET'    : checkEnv(createEnv({
    'url': `https://mainnet.infura.io/${process.env.INFURA_PROJECT_ID}`,
    'gp' : 5,
    'db' : 'mainnet',
  }), ['INFURA_PROJECT_ID']),
}

getConfig = () => {
  config = ENVIRONMENTS[process.env.NODE_ENV]
  if (config) {
   return config
  } else {
   logger.info('NODE_ENV not defined, using TEST')
   return ENVIRONMENTS['TEST']
  }
}

module.exports = getConfig
