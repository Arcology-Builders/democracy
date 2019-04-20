const common = {}

common.delayedGet = async (getCall, expected) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const res = await getCall()
      if (res === expected) { resolve(res) }
      else { reject(res, expected) }
    }, 2000)
  })
}

common.syncify = (asyncFunc, done) => {
  asyncFunc().then(() => { done() } )
}

module.exports = common
