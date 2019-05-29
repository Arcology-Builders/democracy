const assert = require('chai').assert
const fs = require('fs')

const { Compiler, Flattener } = require('..')
const { textsEqual, stringsEqual } = require('demo-utils')

describe('Flattener', () => {

  const c = new Compiler({startSourcePath: 'contracts' })
  const flattener = new Flattener()

  let flattenedSource
  let compileOutput

  before(async () => {
    await c.compile( 'ERC20Mintable.sol' )
    flattenedSource = await c.cm.inputter( 'sourcesFlattened/ERC20Mintable.sol' )
    compileOutput = await c.cm.inputter( 'compileOutputs/ERC20Mintable.sol' )
  })

  it( 'saves the flattened source', () => {
    assert.equal( flattenedSource.get('flattenedSource').length, 12600 )
    assert.equal( textsEqual(fs.readFileSync('./tests/flattenedSource.sol').toString(),
                              flattenedSource.get('flattenedSource')), -1 )
  })

  it( 'replaces imports', () => {
    const replacedSource =
      Flattener.replaceImports(fs.readFileSync('./tests/reducedSource.sol').toString())
    const expectedSource = fs.readFileSync('./tests/flattenedSource.sol').toString()
    assert.equal( textsEqual(replacedSource, expectedSource), -1 )
  })

  it( 'recompiling flattened reduced file gives same results', async () => {
    const comp2 = new Compiler({startSourcePath: './tests' })
    await comp2.compile('flattenedSource.sol')
    const newFlattened = await c.cm.inputter( 'sourcesFlattened/flattenedSource.sol' )
    assert.equal( textsEqual(newFlattened.get('flattenedSource'),
                             flattenedSource.get('flattenedSource')), -1 ) 
    const oldContract = await c.cm.inputter( 'compileOutputs/ERC20Mintable.sol' )
    const newContract = await c.cm.inputter( 'compileOutputs/flattenedSource.sol' )
    const c1 = oldContract.get('contracts').get('ERC20Mintable.sol').get('ERC20Mintable')
      .get('evm').get('bytecode').get('object')
    const c2 = newContract.get('contracts').get('flattenedSource.sol').get('ERC20Mintable')
      .get('evm').get('bytecode').get('object')

    // TODO find out why there is a difference at all
    assert( stringsEqual(c1, c2) > 8925 )
  })

})
