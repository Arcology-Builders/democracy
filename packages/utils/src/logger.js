// Class for flexible, namespaced logging
// With possible future extension to write output to a file.

const { Map, List } = require('immutable')
const assert = require('chai').assert
const colors = require('colors')

const logger = []

logger.Logger = function(prefix, enabled, getConfig) {
  if (this.prefix) { console.trace(); throw `prefix predefined to ${this.prefix}` }

  this.getConfig = getConfig ? getConfig : require('./config').getConfig
 
  // Only use config if we are not provided a list, to avoid self-loop in ./config.js 
  this.enabled = (enabled) ? enabled : this.getConfig()['LOG_LEVELS']
  assert(this.enabled.indexOf('error'))
  this.out = (this.getConfig()['LOG_OUT'] === 'console') ? console.log : () => {}

  this.prefix = prefix

  this.printMsgs = (type, msgs) => {
    if (this.enabled.indexOf(type) !== -1) {
      msgs.forEach((msg) => {
       const str = (Map.isMap(msg) || List.isList(msg)) ?
         msg.toString() : JSON.stringify(msg)
       this.out(`[${this.prefix}]`.magenta + `[${type}]`.green +`${str}`) })
    }
  }

  this.debug = (...msgs) => {
    //let namespace  = (typeof(_namespace) == 'string') ? "["+_namespace+"]" : "";
      
    this.printMsgs('debug', msgs)
  }

  this.info = (...msgs) => {
    this.printMsgs('info', msgs)
  }
  
  this.warn = (...msgs) => {
    this.printMsgs('warn', msgs)
  }
  
  this.errorAndThrow = (msg) => {
    console.error("["+this.prefix+"] " + msg)
    throw new Error(msg)
  }
  
  // Always print errors for now
  this.error = (...msgs) => {
    this.printMsgs('error', msgs, console.error)
  }

}

module.exports = logger
