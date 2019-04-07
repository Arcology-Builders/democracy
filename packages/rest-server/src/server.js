const express = require('express')
const { setImmutableKey: set, getImmutableKey: get, isNetName, fromJS }
	      = require('@democracy.js/utils')
const { Map } = require('immutable')
const utils = require('ethereumjs-utils')

var bodyParser = require('body-parser');

class RESTServer {

  constructor(_port, _allowCORS) {
    this.port = _port || 7000
    this.app     = express()

    // configure app to use bodyParser()
    // this will let us get the data from a POST
    this.app.use(bodyParser.json({limit: '50mb'}));
    this.app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));

    if (_allowCORS) {
      // Allow CORS for development use
      this.app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      })
    }
    this.router = express.Router()
    this.populateRoutes(this.router)
    this.app.use('/api', this.router)
    
    // server static files from the 'public' folder
    this.app.use(express.static(__dirname + '/public'));

  }

  getRouter() {
    return this.router
  }

  static constructKey(body, res) {
    const address = body.address
    utils.isValidAddress(address) || res.send(`Invalid address ${address}`)
    const sym = body.sym
    const netName = body.netName
    isNetName(netName) || res.send(`Invalid net name ${netName}`)
    const suffix = body.hash ? `/${hash}` : ``
    return `${address}/${netName}/unspent/${sym}${suffix}`
  }

  populateRoutes(_router) {
    // middleware to use for all requests
    _router.use((req, res, next) => {
        // do logging
        console.log('Something is happening.');
        next(); // make sure we go to the next routes and don't stop here
    });

    _router.route('/deploys/:chainId/:deployName').get((req, res) => {
    })

    _router.route('/links/:chainId/:deployName').get((req, res) => {
    })

    _router.route('/compiles/:contractName').post((req, res) => {
      const cn = req.params.contractName
      const cxt = req.params.context
      console.log(req.body)
      set(`/compiles/${cn}`, fromJS(req.body))
      res.json(req.body) 
    })

    _router.route('/compiles/:contractName').get((req, res) => {
      const cn = req.params.contractName
      const cxt = req.params.context
      const compile = get(`/compiles/${cn}`, new Map({}))
      res.json(compile.toJS())
    })

    _router.route('/keys/:chainId/:ethAddress').put((req, res) => {
    })

    _router.route('/keys/:chainId/:ethAddress').get((req, res) => {
    })

    _router.route('/test').get((req, res) => {
      const val = get('/test', '')
      res.json({ val: val })
    })

    _router.route('/test').post((req, res) => {
      console.log(`NOTE ${req.body}`)
      const test = Map({
        body: req.body,
      })
      set('/test', test, true)
      res.json({ message: 'Test posted!', ...req.body });
    })

  }

  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`Express running -> PORT ${server.address().port}`);
    });
  }

}

module.exports = RESTServer
