// Class for flexible, namespaced logging
// With possible future extension to write output to a file.

const { Map, List } = require('immutable')
const assert = require('chai').assert

const Logger = function(prefix, enabled) {
  if (this.prefix) { console.trace(); throw `prefix predefined to ${this.prefix}` }
 
  // Only use config if we are not provided a list, to avoid self-loop in ./config.js 
  this.enabled = (enabled) ? enabled : require('./config')['getConfig']()['LOG_LEVELS']
  console.log('Enabled', JSON.stringify(this.enabled))
  assert(this.enabled.indexOf('error'))

  this.prefix = prefix
  if (typeof(enabled) !== 'object') {
    console.error("enabled param should be a list of strings indicating which log levels.");
    //throw "error";
  }

  this.printMsgs = (type, msgs) => {
    if (this.enabled.indexOf(type) !== -1) {
      msgs.forEach((msg) => {
       const str = (Map.isMap(msg) || List.isList(msg)) ?
         msg.toString() : JSON.stringify(msg)
       console.log("["+this.prefix+"] " + str) })
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
  this.error = (msg) => {console.error("["+this.prefix+"] " + msg) }

}

module.exports = Logger
