const demo = require('..')

eth = demo.getNetwork('test')

demo.compile('contracts', 'TestLibrary.sol')
demo.link('TestLibrary','test','account0','linkLib')
demo.deploy('TestLibrary','test','linkLib','deployLib','')

demo.link('TestUseLibrary','test','account0','linkBr','TestLibrary=deployLib')
demo.deploy('TestUseLibrary','test','linkBr','deployAAA')

demo.cleanCompile('TestLibrary')
//demo.cleanLink(eth, 'TestLibrary-linkLib')
//demo.cleanLink(eth, 'TestLibrary-linkBr')
//demo.cleanDeploy(eth, 'TestLibrary-deployLib')
//demo.cleanDeploy(eth, 'TestUseLibrary-deployAAA')

