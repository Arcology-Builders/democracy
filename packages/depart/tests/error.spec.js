const { runTransforms } = require('demo-transform')
const { createTransform } = require('demo-state')
const { Map } = require('immutable')
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
      runTransforms( [ mainFunc, m1 ] )
    ).to.be.rejectedWith(Error)
  })

  it('throw inside mainFunc', () => {
    const m1 = createTransform({
      func: async ({}) => {
      },
      inputTypes: Map({}),
      outputTypes: Map({}),
    })
    
    const mainFunc = createTransform({
      func: async ({}) => {
        throw new Error("I'm an error in a mixin")
      },
      inputTypes: Map({}),
      outputTypes: Map({}),
    })
      
    expect (
      runTransforms( [ mainFunc, m1 ] )
    ).to.be.rejectedWith(Error)
  })

})
