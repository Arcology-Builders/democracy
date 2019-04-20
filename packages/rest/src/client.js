'use strict'
const assert      = require('chai').assert
const { List, Map }
                  = require('immutable')
const http        = require('http')
const url         = require('url')
const { Logger }  = require('@democracy.js/utils')
const LOGGER      = new Logger('rest/client')

const client = {}

client.RemoteDB = class {

  constructor(_host, _port) {
    this.host = _host
    this.port = _port
    this.url  = `http://${_host}:${_port}`
  } 

  async config() {
    return getHTTP('/api/config')
  } 

  async postHTTP(_apiPath, _bodyObj, _overwrite) {
    const post_data = JSON.stringify(_bodyObj)
    const post_options = {
      host: this.host,
      port: this.port,
      path: _apiPath,
      method: 'POST',
      headers: {
          'Content-Type'        : 'application/json',
          'Democracy-Overwrite' : String(_overwrite),
          'Content-Length'      : Buffer.byteLength(post_data),
      }
    }
    return new Promise((resolve, reject) => {
			const post_req = http.request(post_options, (res) => {
				res.setEncoding('utf8')
				const data = []
				res.on('data', (chunk) => {
					data.push(Buffer.from(chunk))
				}).on('end', () => {
					const body = Buffer.concat(data)
          resolve(body.toString())
				}).on('error', (err) => {
          LOGGER.error('res error', err)
          reject(err)
        })
			})

      post_req.on('error', (err) => {
        LOGGER.error('req error', err)
        reject(err)
      })
			post_req.write(post_data)
			post_req.end()
    })
  }
 
  async getHTTP(_apiPath) {
    return new Promise((resolve, reject) => {
      http.get(url.parse(this.url + _apiPath), (res) => {
				const data = []
				res.on('data', (chunk) => {
					data.push(chunk);
				}).on('end', () => {
					const body = Buffer.concat(data)
				  resolve(body.toString())	
				}).on('error', (err) => {
					reject(err)
        })
      })
    }) 
  }

}

module.exports = client
