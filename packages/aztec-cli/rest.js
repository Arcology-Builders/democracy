const { RESTServer } = require('demo-rest')
const {
  fromJS,
  setImmutableKey: set,
  getImmutableKey: get
} = require('demo-utils')

server = new RESTServer(7000, true)

const NOTES_DIR = 'zkNotes'
const MINTS_DIR  = 'zkMintedTotals'
const { Map }   = require('immutable')
const router    = server.getRouter()

// AZTEC notes
router.route(`/${NOTES_DIR}/:chainId/:ownerAddress/:tokenAddress/:zkNoteHash`).post((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const jsBody = fromJS(req.body)
  const zkNoteHash = jsBody.get('zkNoteHash')
  set(`${NOTES_DIR}/${chainId}/${ownerAddress}/${tokenAddress}/${zkNoteHash}`, jsBody)
  res.json(jsBody)
})

router.route(`/${MINTS_DIR}/:chainId/:ownerAddress/:tokenAddress`).post((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const jsBody = fromJS(req.body)
  //const noteHash = jsBody.get('noteHash')
  set(`${MINTS_DIR}/${chainId}/${ownerAddress}/${tokenAddress}`, jsBody, true )
  res.json(req.body)
})

router.route(`/${MINTS_DIR}/:chainId/:ownerAddress/:tokenAddress`).get((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const oldTotalNote = get(`${MINTS_DIR}/${chainId}/${ownerAddress}/${tokenAddress}`)
  res.json(oldTotalNote.toJS())
})

router.route(`/${NOTES_DIR}/:chainId/:ownerAddress/:tokenAddress`).get((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const allNotes = get(`${NOTES_DIR}/${chainId}/${ownerAddress}/${tokenAddress}`)
  res.json(allNotes.toJS())
})

router.route(`/${NOTES_DIR}/:chainId/:ownerAddress/:tokenAddress/:zkNoteHash`).get((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const zkNoteHash = req.params.zkNoteHash
  const outs = get(`${NOTES_DIR}/${chainId}/${ownerAddress}/${tokenAddress}/${zkNoteHash}`)
  res.json(outs.toJS())
})

router.route('/zkNotesByStatus/:chainId/:ownerAddress/:tokenAddress/:status').get((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const status = req.params.status
  const outs = get(`${NOTES_DIR}/${chainId}/${ownerAddress}/${tokenAddress}`)
  res.json(outs.filter((val) => val.get('status') === status).toJS())
})

router.route('/zkNotesByStatus/:chainId/:ownerAddress/:tokenAddress/:status').post((req, res) => {
  const chainId = req.params.chainId
  const ownerAddress = req.params.ownerAddress
  const tokenAddress = req.params.tokenAddress
  const status = req.params.status
  const outs = get(`${NOTES_DIR}/${chainId}/${ownerAddress}/${tokenAddress}`)
  res.json(outs.filter((val) => val.get('status') === status).toJS())
})

server.listen()

