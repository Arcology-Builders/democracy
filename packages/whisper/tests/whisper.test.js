'use strict'
const assert        = require('chai').assert
const randombytes   = require('randombytes')
const { Whisperer } = require('..')
const { getConfig } = require('demo-utils')
const { Range }     = require('immutable')
const utils         = require('ethjs-unit')
const { Logger }    = require('demo-utils')
const LOGGER        = new Logger('whisper.spec')

describe( 'The Whisper Whisperer', () => {
  
  let w
  let w2

  const topics = Range(0,4).map(
    (i) => '0x' + utils.padLeft(randombytes(4).toString('hex'), 8)).toJS()
  const randomMsg = randombytes(24).toString('hex')

  before(async () => {
    process.env.NODE_ENV='TEST'
    w = new Whisperer({
      defaultTTL: 60,
      defaultPOWTarget: 3,
      defaultPOWTime: 2,
    })
    w2 = new Whisperer({
      defaultTTL: 60,
      defaultPOWTarget: 3,
      defaultPOWTime: 2,
    })

    process.env.NODE_ENV='TEST'
    assert.equal(w2.whisperNodeURL, 'ws://eth.arcology.nyc:8546')
    await w2.init("default")
  })

  it( 'gets a keyPair ID', async () => {
    await w.init('dumbpassword')
    assert.equal(w.keyPairId.length, 64,
                 `KeyPairId is the wrong length ${w.keyPairId.length}`)
    assert(w.shh.hasKeyPair(w.keyPairId))
    assert.equal(w.publicKey.length, 132,
                 `Public key is the wrong length ${w.publicKey.length}`)
    assert.equal(w.channelSymKey.length, 64,
                 `Channel sym key is the wrong length ${w.channelSymKey.length}`)
    LOGGER.debug('TOPICS', topics)
  } )

  it( 'posts a public message to anyone listening on whisper tutorial', async () => {
    const msgHash = await w2.shh.post({
      symKeyID: w2.channelSymKey,
      sig: w2.keyPairId,
      ttl: w2.defaultTTL,
      topic: '0x11223344',
      payload: w2.web3.utils.fromAscii('hello from demo-shh test' + randomMsg),
      powTime: w2.defaultPOWTime,
      powTarget: w2.defaultPOWTarget,
    })

    const msgHash2 = await w2.sendPublic({
      message: 'hello2 from demo-shh test ' + randomMsg,
      channelTopic: '0x11223344',
    })
    LOGGER.debug('msg hashes', msgHash, msgHash2)
  })

  it( 'gets back a public message', async () => {
    /*
    const msgHash = await w2.sendPublic({
      message: randomMsg,
      channelTopic: topics[1]
    })*/
    const subProm = new Promise((resolve, reject) => {
      w2.shh.subscribe('messages', {
        topics: [topics[1]],
        minPow: w2.powTarget,
        symKeyID: w2.channelSymKey,
      }).on('data', (data) => {
        LOGGER.debug("DATA RECEIVED", data) 
        resolve(data)
        //LOGGER.debug("unsubscribing", subscribeId) 
      }).on('error', (err) => {
        reject(err)
      })
    })
    const msgHash = await w2.shh.post({
      symKeyID: w2.channelSymKey,
      sig: w2.keyPairId,
      ttl: w2.defaultTTL,
      topic: topics[1],
      payload: w2.web3.utils.fromAscii(randomMsg),
      powTime: w2.defaultPOWTime,
      powTarget: w2.defaultPOWTarget,
    })
    LOGGER.debug('msgHash', msgHash)
    return subProm  
    /*
    .then((subscribeProm) => {
      return subscribeProm.id
    }).then((subscribeId) => {
        LOGGER.debug("subscribeId", subscribeId) 
        return w2.shh.clearSubscriptions()
    }).then((result) => {
      assert(result, `Unsubscribe was successfull`)
    })
*/
/*
        onData: (sig, msg) => {
          assert.equal(sig, w2.publicKey, `Public key of sender should be itself.`)
          assert.equal(msg, randomMsg, `Received message was not the random one sent.`)
          resolve(msg)
        },
        onError: (err) => {
          LOGGER.error('Public message error')
          reject(err)
        },
      })
       */
/*
      await w2.shh.unsubscribe('messages', {
        topics: [topics[1]],
        symKeyID: w2.channelSymKey,
      }).on('data', (data) => {
        LOGGER.debug("DATA RECEIVED", data) 
      }).on('error', (err) => {
        LOGGER.error("ERROR", err)
      })
     */
  })
/*
  it( 'gets back a private message', async () => {
    const randomMsg = randombytes(24).toString('hex')
    //await .sendPublic({message: randomMsg, channelTopic: topics[1]})
      const msgHash = await w2.shh.post({
        pubKey: w2.publicKey,
        sig: w2.keyPairId,
        ttl: 2,
        topic: topics[1],
        payload: w2.web3.utils.fromAscii(randomMsg),
        powTime: 1,
        powTarget: 3,
      })
      LOGGER.debug('msgHash', msgHash)

    return new Promise((resolve, reject) => { 
      w2.subscribePrivate({
        channelTopics: [topics[1]],
        onData: (sig, msg) => {
          assert.equal(sig, w2.publicKey, `Public key of sender should be itself.`)
          assert.equal(msg, randomMsg, `Received message was not the random one sent.`)
          resolve(msg)
        },
        onError: (err) => {
          LOGGER.error('Public message error')
          reject(err)
        },
      })
    }).then(() => {
      return w2.shh.cleanSubscriptions()
    })
  })
*/
})
