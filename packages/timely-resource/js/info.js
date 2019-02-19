contract = new require('../js/contract')('TimelyResource')

var instance = contract.instance

console.log("Instance: " + JSON.stringify(instance));
console.log("Owner: " + instance.owner());
console.log("Interval: " + JSON.stringify(instance.getInterval()));
