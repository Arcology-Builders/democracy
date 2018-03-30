// Compile with solcjs
fs = require('fs')
path = require('path')
solc = require('solc')
assert = require('assert')
Mocha = require('mocha')

// Tests from democracy
DEMO_PATH = "test"
inputs = {};

queue = [DEMO_PATH]

if (process.argv.length > 2) {
  testFiles = [process.argv[2]]
  console.log(JSON.stringify(testFiles))
} else {
  testFiles = []

  while (queue.length > 0) {
    fullpath = queue.pop();
    f = path.basename(fullpath)
    //f = path.basename(fullpath)

    console.log(f)
    if (fs.lstatSync(fullpath).isDirectory()) {
      fs.readdirSync(f).forEach((f2) => queue.push(path.join(f,f2)))
    }
    else if (f.substr(-3) === '.js' && f.substr(0,4) === 'test') {
      source = fs.readFileSync(fullpath).toString();
      testFiles.push(fullpath);
    }
  }
}

mocha = new Mocha({
  timeout: 3000
})
testFiles.forEach((file) => { console.log(file); mocha.addFile(file) })

mocha.run((failures) => {
  console.error(failures)
})
