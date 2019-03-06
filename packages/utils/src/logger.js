// Class for flexible, namespaced logging
// With possible future extension to write output to a file.

const Logger = function(prefix, enabled) {
  if (this.prefix) { console.trace(); throw `prefix predefined to ${this.prefix}` }

  this.prefix = prefix
  if (typeof(enabled) !== 'object') {
    console.error("enabled param should be a list of strings indicating which log levels.");
    //throw "error";
  }

  this.debug = (msg, _namespace) => {
    let namespace  = (typeof(_namespace) == 'string') ? "["+_namespace+"]" : "";
      
    if (enabled.indexOf('debug') !== -1) {
      console.log(`[{this.prefix}]{namespace} {msg}`)
    }
  }

  this.info = (msg, namespace) => {
    if (enabled.indexOf('info') !== -1) {
      console.log("["+this.prefix+"] " + msg)
    }
  }
  
  // Always print errors for now
  this.error = (msg) => { console.error("["+this.prefix+"] " + msg) }

}

module.exports = Logger
