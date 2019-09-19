'use strict'
/**
 * Environment-controlled configuration to choose network and deploy parameters
 *
 * @namespace config
 * @memberof module:utils
 */

require('dotenv').config()
const { Logger } = require('./logger')
const { version } = require('../package.json')
// Pass in log-levels explicitly because this LOGGER cannot include itself
const assert = require('chai').assert

const { Map } = require('immutable')

const configs = {}

configs.setEnvVars = (_env) => {
  new Map(_env).forEach((val,key) => { process.env[key] = val })
}

// TODO: corresponds to eth.arcology.nyc but our Whisper node is not accepting
// packets addresses to this hostname for some reason.
//const SHH_IP = "ws://54.69.190.230:8546"
const SHH_IP = 'ws://eth.arcology.nyc:8546'
const createEnv = ({ ethURL, dbURL, shhURL, gl, gp, db, lo, ll, da, dp }) => {
  return {
    'DB_URL'            : dbURL,
    'ETH_URL'           : ethURL,
    'SHH_URL'           : shhURL,
    'DB_NAMESPACE'      : db,
    'GAS_PRICE'         : gp,
    'GAS_LIMIT'         : gl,
    'LOG_OUT'           : lo,
    'LOG_LEVELS'        : ll,
    'DEPLOYER_ADDRESS'  : da,
    'DEPLOYER_PASSWORD' : dp,
    'VERSION'           : version,
  }
}

const checkEnv = (config, vars) => {
  vars.forEach((v) => {
    if (process.env[v] || (typeof window != 'undefined' && window.document
                           && window[v])) {
      return
    } else { 
      LOGGER.errorAndThrow(`Environment variable ${v} needed but not defined.`)
    }
  })
  return config
}

/**
 * @method parseLogLevels
 * @memberof module:utils
 */
configs.parseLogLevels = (string) => {
  return (string) ? string.split(',').map((l) => l.toLowerCase() ) : string
}

const createDevEnv = (infuraProjectId) => {
  return createEnv({
    'dbURL' : getEnvVar( 'DEVELOPMENT.DB_URL'  ) || 'http://localhost:7000',
    'ethURL': getEnvVar( 'DEVELOPMENT.ETH_URL' ) || 'http://localhost:8545',
    'shhURL': getEnvVar( 'DEVELOPMENT.SHH_URL' ) || 'ws://localhost:8546',
    'gp'    : getEnvVar( 'DEVELOPMENT.GAS_PRICE' ) || 5,
    'gl'    : getEnvVar( 'DEVELOPMENT.GAS_LIMIT' ) || '670000',
    'db'    : 'dev',
    'lo'    : getEnvVar( 'DEVELOPMENT.LOG_OUT' ),
    'll'    : configs.parseLogLevels(getEnvVar( 'DEVELOPMENT.LOG_LEVELS' )) ||
              [ 'info', 'warn', 'error' ],
    'da'    : getEnvVar( 'DEVELOPMENT.DEPLOYER_ADDRESS' ),
    'dp'    : getEnvVar( 'DEVELOPMENT.DEPLOYER_PASSWORD' ),
  })
}
	
const ENVIRONMENTS = {
  'DEVELOPMENT': createDevEnv,
  'DEV'        : createDevEnv,
  'TEST'       : (infuraProjectId) => {
    return createEnv({
      'dbURL'  : getEnvVar( 'TEST.DB_URL'  ) || 'https://ganache.arcology.nyc:7001',
      'ethURL' : getEnvVar( 'TEST.ETH_URL' ) || 'https://ganache.arcology.nyc:8547',
      'shhURL' : getEnvVar( 'TEST.SHH_URL' ) || SHH_IP,
      'gp'     : getEnvVar( 'TEST.GAS_PRICE' ) || 5,
      'gl'     : getEnvVar( 'TEST.GAS_LIMIT' ) || '670000',
      'db'     : 'test',
      'lo'     : getEnvVar( 'TEST.LOG_OUT' ),
      'll'     : configs.parseLogLevels(getEnvVar( 'TEST.LOG_LEVELS' )) ||
               [ 'info', 'warn', 'error' ],
      'da'    : getEnvVar( 'TEST.DEPLOYER_ADDRESS'  ),
      'dp'    : getEnvVar( 'TEST.DEPLOYER_PASSWORD' ),
    }) },
  'RINKEBY'    : (infuraProjectId) => { return checkEnv(createEnv({
    'dbURL'  : getEnvVar( 'RINKEBY.DB_URL'  ) || 'https://rinkeby.arcology.nyc:8547',
    'ethURL' : getEnvVar( 'RINKEBY.ETH_URL' ) || `https://rinkeby.infura.io/v3/${infuraProjectId}`,
    'shhURL' : getEnvVar( 'RINKEBY.SHH_URL' ) || SHH_IP,
    'gp'     : 5,
    'gl'     : '670000',
    'db'     : 'rinkeby',
    'lo'     : getEnvVar( 'RINKEBY.LOG_OUT' ),
    'll'     : configs.parseLogLevels(getEnvVar( 'RINKEBY.LOG_LEVELS' )) ||
               [ 'warn', 'error' ],
    'da'    : getEnvVar( 'RINKEBY.DEPLOYER_ADDRESS'  ),
    'dp'    : getEnvVar( 'RINKEBY.DEPLOYER_PASSWORD' ),
  }), ['INFURA_PROJECT_ID']) },
  'MAINNET'    : (infuraProjectId) => { return checkEnv(createEnv({
    'dbURL'  : getEnvVar( 'MAINNET.DB_URL'  ) || 'https://mainnet.arcology.nyc:8545',
    'ethURL' : getEnvVar( 'MAINNET.ETH_URL' ) || `https://mainnet.infura.io/v3/${infuraProjectId}`,
    'shhURL' : getEnvVar( 'MAINNET.SHH_URL' ) || SHH_IP,
    'gp'     : 5,
    'gl'     : '670000',
    'db'     : 'mainnet',
    'lo'     : getEnvVar( 'MAINNET.LOG_OUT' ),
    'll'     : configs.parseLogLevels(getEnvVar( 'MAINNET.LOG_LEVELS' )) ||
               [ 'warn', 'error' ],
    'da'    : getEnvVar( 'MAINNET.DEPLOYER_ADDRESS'  ),
    'dp'    : getEnvVar( 'MAINNET.DEPLOYER_PASSWORD' ),
  }), ['INFURA_PROJECT_ID']) },
}

configs.isNetName = (_name) => {
  assert(_name, 'Net name cannot be empty.')
  return (ENVIRONMENTS[_name.toUpperCase()] !== undefined)
}

const lazyEval = (env) => {
  let config = ENVIRONMENTS[env]
  if (typeof(config) === 'function') {
    // Only warn / check for Infura ID when we need it
    const infuraProjectId = getEnvVar('INFURA_PROJECT_ID')
    ENVIRONMENTS[env] = config(infuraProjectId)
    config = ENVIRONMENTS[env]
  }
  return config
}

const getEnvVar = (varName) => {
  if (typeof window != 'undefined' && window.document) {
    return window[varName]
  } else if (process.env[varName]) {
    return process.env[varName]
  } else {
    console.warn(`No env var found called ${varName}`)
    return ''
  }
}

/**
 * Return a configuration object with values determined by NODE_ENV.
 * @method getConfig
 * @memberof module:utils
 */
configs.getConfig = (debugPrint) => {
  const env = getEnvVar('NODE_ENV').toUpperCase()
  debugPrint && LOGGER.debug(`NODE_ENV=${env}`)
  let config = lazyEval(env)
  if (config) {
    return config
  } else {
    debugPrint && LOGGER.debug('NODE_ENV not defined, using TEST')
    return lazyEval('TEST')
  }
}

const LOGGER = new Logger('config', [ 'warn', 'error' ], configs.getConfig)

module.exports = configs
