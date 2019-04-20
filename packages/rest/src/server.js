const express = require('express')
const { setImmutableKey: set, getImmutableKey: get, isNetName, fromJS, Logger,
  COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR }
	      = require('@democracy.js/utils')
const { Map } = require('immutable')
const utils = require('ethereumjs-utils')
const http = require('http')
const LOGGER = new Logger('rest-server')

var bodyParser = require('body-parser')

const server = {}

server.RESTServer = class {

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
    
  }

  getRouter() {
    return this.router
  }

  getApp() {
    return this.app
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
        //LOGGER.debug('Received route', req)
        next() // make sure we go to the next routes and don't stop here
    });

    _router.route('/deploys/:chainId').get((req, res) => {
      const chainId = req.params.chainId
      const deploys = get(`/${DEPLOYS_DIR}/${chainId}`, new Map({}))
      res.json(deploys.toJS())
    })

    _router.route('/deploy/:chainId/:deployName').get((req, res) => {
      const chainId = req.params.chainId
      const deployName = req.params.deployName
      const deploy = get(`/${DEPLOYS_DIR}/${chainId}/${deployName}`, new Map({}))
      res.json(deploy.toJS())
    })

    _router.route('/deploy/:chainId/:deployName').post((req, res) => {
      const chainId = req.params.chainId
      const deployName = req.params.deployName
      const jsBody = fromJS(req.body)
      const overwrite = (req.headers['democracy-overwrite'] === 'true')
      try {
        const result = set(`/${DEPLOYS_DIR}/${chainId}/${deployName}`, jsBody, overwrite)
        res.json({result: result, body: jsBody})
      } catch(e) {
        LOGGER.error('Failed to set key:', e, chainId, deployName)
        res.json({result: false, error: e})
      }
    })

    _router.route('/links').get((req, res) => {
      const links = get(`/${LINKS_DIR}`, new Map({}))
      res.json(links.toJS())
    })

    _router.route('/link/:linkName').get((req, res) => {
      const linkName = req.params.linkName
      const link = get(`/${LINKS_DIR}/${linkName}`, new Map({}))
      res.json(link.toJS())
    })

    _router.route('/link/:linkName').post((req, res) => {
      const linkName = req.params.linkName
      const jsBody = fromJS(req.body)
      const overwrite = (req.headers['democracy-overwrite'] === 'true')
      try {
        const result = set(`/${LINKS_DIR}/${linkName}`, jsBody, overwrite)
        res.json({result: result, body: jsBody})
      } catch(e) {
        LOGGER.error('Failed to set key:', e, linkName)
        res.json({result: false, error: e})
      }
    })

    // Return all compiles
    _router.route('/compiles').get((req, res) => {
      const compiles = get(`/${COMPILES_DIR}`, new Map({}))
      res.json(compiles.toJS())
    })

    _router.route('/compile/:contractName').post((req, res) => {
      const cn = req.params.contractName
      const cxt = req.params.context
      const overwrite = (req.headers['democracy-overwrite'] === 'true')
      set(`/compiles/${cn}`, fromJS(req.body), overwrite)
      res.json(req.body) 
    })

    _router.route('/compile/:contractName').get((req, res) => {
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
      const test = Map({
        body: req.body,
      })
      const overwrite = (req.headers['democracy-overwrite'] === 'true')
      set('/test', test, overwrite)
      res.json({ message: 'Test posted!', ...req.body });
    })
   
  }

  start() {
    this.server = http.createServer(this.app).listen(this.port)
  }
  
  listen() {
    const server = this.app.listen(this.port, () => {
      console.log(`Express server listening on port ${server.address().port}`)
    })
    return server
  }

  stop() {
    if (this.server) {
      this.server.close()
    }
  }

}

module.exports = server
