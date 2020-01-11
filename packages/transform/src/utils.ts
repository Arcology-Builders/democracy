import {
  keccak256, toChecksumAddress, pubToAddress, isValidChecksumAddress
} from 'ethereumjs-util'
import { assert } from 'chai'

export class Keccak256Hash extends Object {
  hashBuffer: Buffer

  public constructor(objectToHash: any) {
    super()
    this.hashBuffer = Buffer.from(keccak256(JSON.stringify(objectToHash)))
  }

  public toString = () : string => {
    return this.hashBuffer.toString('hex')
  }

}

export class EthereumAddress extends Object {
  prefixedAddress: string

  public constructor(address: string) {
    super()
    this.prefixedAddress = toChecksumAddress(address)
    assert( isValidChecksumAddress(this.prefixedAddress) )
  }

  toString() {
    return this.prefixedAddress
  }

  TYPE(obj: any) {
    return (obj instanceof EthereumAddress) && isValidChecksumAddress(obj.prefixedAddress)
  }

}
export class EthereumRecipient extends Object {
  prefixedAddress: string
  prefixedPublicKey: string

  public constructor(publicKey: string) {
    super()
    const prefixedPublicKey = (publicKey.slice(0,2) !== '0x') ? '0x' + publicKey : publicKey
    assert.equal(prefixedPublicKey.length, 130, `Public key has incorrect length`)
    this.prefixedPublicKey = prefixedPublicKey
    this.prefixedAddress = toChecksumAddress(pubToAddress(
      Buffer.from(prefixedPublicKey.slice(2), 'hex')
    ).toString('hex'))
    assert( isValidChecksumAddress(this.prefixedAddress) )
  }

  toString() {
    return this.prefixedAddress
  }

  TYPE(obj: any) {
    return (obj instanceof EthereumRecipient) && isValidChecksumAddress(obj.prefixedAddress)
  }

}
