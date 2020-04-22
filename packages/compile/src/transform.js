const { Map } = require('immutable')
const { assert } = require('chai')

const { TYPES, createTransformFromMap } = require('demo-transform')
const { isCompile, isContract } = require('demo-contract')
const { Compiler } = require('./compile')
const { Logger } = require('demo-utils')

const LOGGER = new Logger('compile.transform')

const transforms = {}

transforms.compileTransform = createTransformFromMap({
  func: async ({ sourcePathList, bm, compileFlatten, compileOutputFull }) => {

    /*
		const c = new Compiler({
			sourcePathList : sourcePathList,
			bm             : bm,
			flatten        : compileFlatten,
			outputFull     : compileOutputFull,
		})
*/

    LOGGER.debug('compileTransform')
		let compiles = new Map()
		const compile = async ( contractName, sourceFile ) => {
      /*
			assert(sourceFile && sourceFile.endsWith('.sol'),
						 'sourceFile param not given or does not end with .sol extension')
			const output = await c.compile( sourceFile )
			assert(isCompile(output))
			assert.equal( output.get(contractName).get('name'), contractName )
			return new Promise((resolve, reject) => {
				setTimeout( async () => {
					const contract = await bm.getContract(contractName)
					assert( isContract(contract), `Contract ${contractName} not found` )
					compiles = compiles.set(contractName, output.get(contractName))
					resolve(output)
				}, 2000)
			})
    */
		}

    const getCompiles = () => {
      return compiles
    }

		const cleanCompiles = async () => {
			const compileList = List(compiles.map((c, name) => {
				return bm.cleanContract( name )
			}).values()).toJS()
			await Promise.all( compileList ).then((vals) => { LOGGER.debug( 'Clean compiles', vals) })
		}

		return new Map({
			cleanCompiles,
      compile,
      getCompiles,
    })
		
  },
  inputTypes: Map({
    bm                : TYPES.bm             ,
    sourcePathList    : TYPES.array          ,
    compileFlatten    : TYPES.boolean.opt    ,
    compileOutputFull : TYPES.boolean.opt    ,
  }),
  outputTypes: Map({
    compile       : TYPES['function'],
    getCompiles   : TYPES['function'],
    cleanCompiles : TYPES['function'], 
  })
})

module.exports = transforms
