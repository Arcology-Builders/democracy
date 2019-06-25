const { RESTServer } = require('./src/server')
const {
  fromJS,
  setImmutableKey: set,
  getImmutableKey: get
} = require('demo-utils')

server = new RESTServer(7000, true)
server.start()

const NOTES_DIR = 'notes'
const MINT_DIR  = 'mintTotalNote'
const { Map }   = require('immutable')
const router    = server.getRouter()

// AZTEC notes
router.route('/notes/:chainId/:ownerAddress/:tokenAddress').post((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const jsBody = fromJS(req.body)
  const noteHash = jsBody.get('noteHash')
  const outs = set(`${NOTES_DIR}/${chainId}/${noteHash}`, jsBody)
  res.json(outs.toJS())
})

router.route('/notes/:chainId/:ownerAddress/:tokenAddress/mintTotal').post((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const jsBody = fromJS(req.body)
  const noteHash = jsBody.get('noteHash')
  set(`${NOTES_DIR}/${chainId}/${tokenAddress}/${MINT_DIR}`,
                   Map({ noteHash }), true )
  const outs = set(`${NOTES_DIR}/${chainId}/${noteHash}`, jsBody)
  res.json(req.body)
})

router.route('/notes/:chainId/:ownerAddress/:tokenAddress/mintTotal').get((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const oldTotalNoteHash = get(`${NOTES_DIR}/${chainId}/${tokenAddress}/${MINT_DIR}`)
    .get('noteHash')
  const oldTotalNote = get(`${NOTES_DIR}/${chainId}/${oldTotalNoteHash}`)
  res.json(oldTotalNote.toJS())
})

router.route('/notes/:chainId/:noteHash').get((req, res) => {
  const chainId = req.params.chainId
  const mintTotal = req.params.mintTotal
  const noteHash = req.params.noteHash
  const outs = get(`${NOTES_DIR}/${chainId}/${noteHash}`)
  res.json(outs.toJS())
})

