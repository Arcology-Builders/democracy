// Environment-controlled configuration to choose network and deploy parameters

const Logger = require('./logger')
const LOGGER = new Logger('config', [ 'info', 'debug', 'warn', 'error' ])
const assert = require('chai').assert

const { Map } = require('immutable')

const configs = {}

configs.setEnvVars = (_env) => {
  new Map(_env).forEach((val,key) => { process.env[key] = val })
}

const createEnv = ({ ethURL, dbURL, gp, db, ll }) => {
  return {
    'DB_URL'      : dbURL,
    'ETH_URL'     : ethURL,
    'DB_NAMESPACE': db,
    'GAS_PRICE'   : gp,
    'LOG_LEVELS'  : ll,
  }
}

const checkEnv = (config, vars) => {
  vars.forEach((v) => {
    if (!process.env[v]) {
      LOGGER.errorAndThrow(`Environment variable ${v} needed but not defined.`)
    }
  })
  return config
}

const createDevEnv = () => {
  return createEnv({
    'dbURL' : "http://localhost:7000",
    'ethURL': "http://localhost:8545",
    'gp'    : 5,
    'db'    : 'dev',
    'll'    : [ 'info', 'debug', 'warn', 'error' ],
  })
}
	
const ENVIRONMENTS = {
  'DEVELOPMENT': createDevEnv,
  'DEV'        : createDevEnv,
  'TEST'       : () => {
    LOGGER.info('TEST.DB_URL', process.env['TEST.DB_URL'])
    return createEnv({
    'dbURL'  : process.env[ 'TEST.DB_URL'  ] || 'http://ganache.arcology.nyc:7000',
    'ethURL' : process.env[ 'TEST.ETH_URL' ] || 'http://ganache.arcology.nyc:8545',
    'gp'     : 5,
    'db'     : 'test',
    'll'     : ['info', 'warn', 'error'],
  }) },
  'RINKEBY'    : () => { return checkEnv(createEnv({
    'dbURL'  : process.env[ 'RINKEBY.DB_URL'  ] || 'http://ganache.arcology.nyc:8545',
    'ethURL' : process.env[ 'RINKEBY.ETH_URL' ] || `https://rinkeby.infura.io/${process.env.INFURA_PROJECT_ID}`,
    'gp'     : 5,
    'db'     : 'rinkeby',
    'll'     : ['warn', 'error'],
  }), ['INFURA_PROJECT_ID']) },
  'MAINNET'    : () => { return checkEnv(createEnv({
    'dbURL'  : process.env[ 'MAINNET.DB_URL'  ] || 'http://ganache.arcology.nyc:8545',
    'ethURL' : process.env[ 'MAINNET.ETH_URL' ] || `https://mainnet.infura.io/${process.env.INFURA_PROJECT_ID}`,
    'gp'     : 5,
    'db'     : 'mainnet',
    'll'     : ['warn', 'error'],
  }), ['INFURA_PROJECT_ID']) },
}

configs.isNetName = (_name) => {
  assert(_name, 'Net name cannot be empty.')
  return (ENVIRONMENTS[_name.toUpperCase()] !== undefined)
}

const lazyEval = (env) => {
  config = ENVIRONMENTS[env]
  if (typeof(config) === 'function') {
    ENVIRONMENTS[env] = config()
    config = ENVIRONMENTS[env]
  }
  return config
}

configs.getConfig = () => {
  const windowEnv = (typeof window != 'undefined' && window.document) ? window.NODE_ENV : ""
  const processEnv = process.env.NODE_ENV ? process.env.NODE_ENV.toUpperCase() : ""
  const env = windowEnv ? windowEnv : processEnv
  LOGGER.debug(`NODE_ENV=${env}`)
  config = lazyEval(env)
  if (config) {
   return config
  } else {
   LOGGER.info('NODE_ENV not defined, using TEST')
   return lazyEval('TEST')
  }
}

module.exports = configs
