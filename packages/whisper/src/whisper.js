const { getConfig, Logger } = require('demo-utils')
const LOGGER = new Logger('whisper')

const Web3 = require('web3')

const whispers = {}

/**
 * Class encapsulating a Whisper identity and methods for sending messages initiated by
 * the caller and receiving messages (by registered callbacks), both public and private,
 * from this indentity.
 * @param ttl {Number} default time-to-live for messages in seconds
 */
whispers.Whisperer = class {

  constructor({defaultTTL, defaultPOWTarget, defaultPOWTime}) {
    this.whisperNodeURL = getConfig()['SHH_URL']
    this.defaultTTL = defaultTTL
    this.defaultPOWTarget = defaultPOWTarget
    this.defaultPOWTime = defaultPOWTime
    LOGGER.info("Creating Whisperer", this)
    this.web3 = new Web3( new Web3.providers.WebsocketProvider(this.whisperNodeURL,
                                           {headers: {Origin: "mychat"}})
    )
    this.shh = this.web3.shh
  }

  /**
   * Asynchronously initiatlize this Whisperer after construction.
   * Allocates a new keyPair identity and a channelSymKey.
   * @param channelPassword {String} password to generate the channel symmetric key
   */
  async init(channelPassword) { 
    await this.web3.eth.net.isListening()
    this.keyPairId     = await this.shh.newKeyPair()
    this.publicKey     = await this.shh.getPublicKey(this.keyPairId)
    this.channelSymKey = await this.shh.generateSymKeyFromPassword(channelPassword) 
  }

  /**
   * Asynchronously subscribe to the given channel topics of this Whisperer's
   * previously allocated channel symKey. Register callbacks for receiving messages
   * and decoding errors.
   * @param channelTopics {Array} of strings, topics to subscribe in this channel
   * @param onData {Function} callback of (sig {String}, message {String}) when a new
   *        message is received on any of the given topics.
   * @param onError {Function} callback of (err {Object}) when there is an error decoding
   *        an incoming message on any of the subscribed topics.
   */
  async subscribePublic({channelTopics, onData, onError}) { 
    this.web3.shh.subscribe("messages", {
      minPow  : this.powTarget,
      symKeyID: this.channelSymKey,
      topics  : channelTopics,
    }).on('data', (data) => {
      onData(data.sig, this.web3.utils.toAscii(data.payload))
    }).on('error', (err) => {
      LOGGER.error(`shh subscribe error for channel sym key ${channelSymKey}`, err) 
      onError("Couldn't decode message: " + err.message)
    })
  }

  async subscribePrivate({channelTopics, onData, onError}) {
		// Subscribe to private messages
		this.web3.shh.subscribe("messages", {
			minPow: this.powTarget,
			privateKeyID: this.keyPairId,
			topics: channelTopics,
		}).on('data', (data) => {
			onData(data.sig, this.web3.utils.toAscii(data.payload), true);
		}).on('error', (err) => {
      LOGGER.error(`shh private subscribe error for keyPairId ${this.keyPairId}`, err) 
			onError("Couldn't decode message: " + err.message);
		});
  }

  /**
   * Asynchronously unsubscribe from the list of given channel topics
   * for this Whisperer's channel symmetric key.
   * @param channelTopics
   */
  async unsubscribePublic({channelTopics}) {
    this.web3.shh.unsubscribe("messages", {
      symKeyID: this.channelSymKey,
      topics  : channelTopics,
    }).on('error', (err) => {
      LOGGER.error(`shh unsubscribe error for channel sym key ${channelSymKey}`, err) 
      onError("Couldn't decode message: " + err.message)
    })
  } 

  /**
   * Asynchronously send a public message to this given channel topic.
   * @param message {String} body of message to send as an ASCII string.
   * @param channelTopic {String} topic on which to post this message
   * @param ttl {Number} Optional time-to-live in seconds just for this message
   * @return message hash
   */
  async sendPublic({ message, channelTopic, ttl, powTime, powTarget }) {
    const msgHash = await this.shh.post({
      symKeyID : this.channelSymKey,
      sig      : this.keyPairId,
      ttl      : ttl || this.defaultTTL,
      topic    : channelTopic,
      payload  : this.web3.utils.fromAscii(message),
      powTime  : powTime || this.defaultPOWTime,
      powTarget: powTarget || this.defaultPOWTarget,
    })
    return msgHash
  }

  /**
   * Asynchronously send a private message to with the given body to the given recipient
   * given public key.
   * @param message {String} body of the message to send as an ASCII payload
   * @param pubKey {String} public key of recipient 
   */
  async sendPrivate({message, pubKey, ttl, powTime, powTarget}) {
    const msgHash = await this.shh.post({
      pubKey   : pubKey,
      sig      : this.keyPairId,
      ttl      : ttl || this.defaultTTL,
      topic    : channelTopic,
      payload  : this.web3.utils.fromAscii(message),
      powTime  : powTime || this.defaultPOWTime,
      powTarget: powTarget || this.defaultPOWTarget,
    })
    return msgHash
  }

}

module.exports = whispers
