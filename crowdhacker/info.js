contract = new require('../contract')('CrowdHacker')

func = (instance) => {
  console.log(instance.victim())
}

contract.runFunc(func)
