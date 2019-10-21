"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isValidChecksumAddress = require('ethereumjs-util').isValidChecksumAddress;
var BN = require('bn.js');
var TYPES = require('demo-state').TYPES;
var assert = require('chai').assert;
var _a = require('immutable'), Map = _a.Map, List = _a.List;
var wallet = require('demo-keys').wallet;
var isDeploy = require('demo-contract').isDeploy;
var _b = require('./transform'), makeRequired = _b.makeRequired, makeOptional = _b.makeOptional, ArgCheckerFunc = _b.ArgCheckerFunc;
exports.subStateKey = function (subStateLabel, bareKey) {
    return (subStateLabel) ?
        subStateLabel + bareKey[0].toUpperCase() + bareKey.slice(1) :
        bareKey;
};
var HEX_CHARS = '01234567890abcdef';
exports.isHexPrefixed = function (obj) {
    var allHexChars = function (s, v, k) { return Boolean(s && HEX_CHARS.search(v.toLowerCase()) > -1); };
    return (typeof (obj) === 'string') && (obj.slice(0, 2) === '0x') &&
        List(obj.slice(2)).reduce(allHexChars, true);
};
var contractCheckerFunc = function (obj) {
    return Boolean(obj && isDeploy(obj.deploy) && obj.deployerEth['prepareSignerEth']);
};
var contractInstanceCheckerFunc = function (obj) {
    return Boolean(obj && obj['abi'] && isValidChecksumAddress(obj['address']));
};
var DEMO_CHECKER_FUNCS = Map({
    'function': function (obj) { return (typeof (obj) === 'function'); },
    'ethereumTxHash': function (obj) { return (exports.isHexPrefixed(obj) && obj.length === 66); },
    'ethereumAddress': function (obj) { return isValidChecksumAddress(obj); },
    'ethereumSigner': function (obj) { return Boolean(obj && obj['net_version']); },
    'contract': contractCheckerFunc,
    'contractInstance': contractInstanceCheckerFunc,
    'bm': function (obj) { return Boolean(obj && obj['getDeploys']); },
    'wallet': function (obj) { return Boolean(obj && obj['prepareSignerEth']); },
    'array': function (obj) { return Array.isArray(obj); },
    'bn': function (obj) { return BN.isBN(obj); },
    'any': function (obj) { return true; },
});
exports.DEMO_TYPES = DEMO_CHECKER_FUNCS.map(function (checker, typeName) {
    var requiredChecker = makeRequired(checker, typeName);
    requiredChecker.opt = makeOptional(checker, typeName);
    return requiredChecker;
}).merge(TYPES).toJS();
