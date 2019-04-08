// Class for flexible, namespaced logging
// With possible future extension to write output to a file.

const { Map, List } = require('immutable')
const assert = require('chai').assert
const colors = require('colors')

const Logger = function(prefix, enabled) {
  if (this.prefix) { console.trace(); throw `prefix predefined to ${this.prefix}` }
 
  // Only use config if we are not provided a list, to avoid self-loop in ./config.js 
  this.enabled = (enabled) ? enabled : require('./config')['getConfig']()['LOG_LEVELS']
  assert(this.enabled.indexOf('error'))

  this.prefix = prefix

  this.printMsgs = (type, msgs, _out) => {
    const out = _out || console.log
    if (this.enabled.indexOf(type) !== -1) {
      msgs.forEach((msg) => {
       const str = (Map.isMap(msg) || List.isList(msg)) ?
         msg.toString() : JSON.stringify(msg)
       out(`[${this.prefix}]`.magenta + `[${type}]`.green +`${str}`) })
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

module.exports = Logger
