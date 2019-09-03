const { run } = require('demo-transform')
const chai = require('chai')
chai.use(require('chai-as-promised'))

const expect = chai.expect

describe('Pipeline errors', () => {

  it('throw inside a mixin', () => {
    
    const m1 = async (state) => {
      throw new Error("I'm an error in a mixin")
    }
    
    const mainFunc = async (state) => {
    }
      
    expect (
      run( mainFunc, [ m1 ] )
    ).to.be.rejectedWith(Error)
  })

  it('throw inside mainFunc', () => {
    const m1 = async (state) => {
    }
    
    const mainFunc = async (state) => {
      throw new Error("I'm an error in a mixin")
    }
      
    expect (
      run( mainFunc, [ m1 ] )
    ).to.be.rejectedWith(Error)
  })

})
