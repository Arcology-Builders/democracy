'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Command-line runners and mixins for extracting arguments and configs of all kinds
 */
var path = require('path');
var assert = require('chai').assert;
var toWei = require('web3-utils').toWei;
var _a = require('demo-utils'), getConfig = _a.getConfig, getNetwork = _a.getNetwork, Logger = _a.Logger;
var _b = require('demo-keys'), wallet = _b.wallet, isAccount = _b.isAccount;
var _c = require('immutable'), Map = _c.Map, List = _c.List;
var isValidChecksumAddress = require('ethereumjs-util').isValidChecksumAddress;
var TYPES = require('./types').DEMO_TYPES;
var transform_1 = require("./transform");
var pipeline_1 = require("./pipeline");
var LOGGER = new Logger('runner');
//export type TransformFunc = (args: AnyObj) => Promise<Args>
exports.createTransformFromMap = function (_a) {
    var func = _a.func, inputTypes = _a.inputTypes, outputTypes = _a.outputTypes;
    assert.typeOf(func, 'function', "Func is not a function, instead " + func);
    assert(Map.isMap(inputTypes), "inputTypes was not a function, instead " + func);
    assert(Map.isMap(outputTypes), "outputTypes was not a function, instead " + func);
    return transform_1.createTransform(new transform_1.Transform(func, inputTypes, outputTypes));
};
/**
 * Deployer mixing that extracts the deployer address/password from the config
 * Binds no arguments.
 *
 * @method deployerMixin
 * @memberof module:cli
 * @return {Function} returns a mixin which takes no input state and returns an
 *   Immutable {Map} of `chainId`, `deployerAddress`, `deployerPassword`, `deployerEth`
 */
exports.deployerTransform = exports.createTransformFromMap({
    func: function (_a) {
        var testValueETH = _a.testValueETH, testAccountIndex = _a.testAccountIndex, unlockSeconds = _a.unlockSeconds, deployerAddress = _a.deployerAddress, deployerPassword = _a.deployerPassword;
        return __awaiter(void 0, void 0, void 0, function () {
            var configAddress, configPassword, deployerComboFromState, _deployerAddress, _deployerPassword, validCombo, _b, deployerEth, createdAddress, createdPassword, chainId, eth, testAccounts;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        configAddress = getConfig()['DEPLOYER_ADDRESS'];
                        configPassword = getConfig()['DEPLOYER_PASSWORD'];
                        return [4 /*yield*/, wallet.init({ autoConfig: true, unlockSeconds: unlockSeconds || 1 })];
                    case 1:
                        _c.sent();
                        LOGGER.debug('deployerAddress from state', deployerAddress);
                        LOGGER.debug('deployerPassword from state', deployerPassword);
                        deployerComboFromState = isValidChecksumAddress(deployerAddress);
                        LOGGER.debug('isValidDeployerComboFromState', deployerComboFromState);
                        _deployerAddress = deployerComboFromState ? deployerAddress : configAddress;
                        _deployerPassword = deployerComboFromState ? deployerPassword : configPassword;
                        LOGGER.debug('_deployerAddress', _deployerAddress);
                        LOGGER.debug('_deployerPassword', _deployerPassword);
                        return [4 /*yield*/, wallet.validatePassword({
                                address: _deployerAddress, password: _deployerPassword
                            })];
                    case 2:
                        validCombo = _c.sent();
                        assert(validCombo, "Invalid address/password combo " + _deployerAddress + " " + _deployerPassword);
                        return [4 /*yield*/, wallet.prepareSignerEth({
                                address: _deployerAddress, password: _deployerPassword
                            })];
                    case 3:
                        _b = _c.sent(), deployerEth = _b.signerEth, createdAddress = _b.address, createdPassword = _b.password;
                        return [4 /*yield*/, deployerEth.net_version()];
                    case 4:
                        chainId = _c.sent();
                        assert.equal(createdAddress, _deployerAddress, "New address created " + createdAddress + " instead of " + _deployerAddress);
                        assert.equal(deployerEth.address, createdAddress);
                        if (!(process.env['NODE_ENV'] === 'DEVELOPMENT' && testValueETH &&
                            Number(testValueETH) !== 0)) return [3 /*break*/, 7];
                        eth = getNetwork();
                        return [4 /*yield*/, eth.accounts()];
                    case 5:
                        testAccounts = _c.sent();
                        LOGGER.debug('testAccount', testAccounts);
                        return [4 /*yield*/, wallet.payTest({
                                fromAddress: testAccounts[testAccountIndex || 0],
                                toAddress: createdAddress,
                                weiValue: toWei(testValueETH, 'ether'),
                            })];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7:
                        LOGGER.debug("Accounts Map is a map", Map.isMap(wallet.getAccountSync(createdAddress)));
                        return [2 /*return*/, new Map({
                                chainId: chainId,
                                deployerAddress: createdAddress,
                                deployerPassword: createdPassword,
                                deployerEth: deployerEth,
                                wallet: wallet,
                            })];
                }
            });
        });
    },
    inputTypes: Map({
        testValueETH: TYPES.string,
        testAccountIndex: TYPES.integer,
        unlockSeconds: TYPES.integer,
        deployerAddress: TYPES.ethereumAddress.opt,
        deployerPassword: TYPES.string.opt,
    }),
    outputTypes: Map({
        chainId: TYPES.string,
        deployerAddress: TYPES.ethereumAddress,
        deployerPassword: TYPES.string,
        deployerEth: TYPES.ethereumSigner,
        wallet: TYPES.wallet,
    })
});
/**
 * Argument list mixin, takes in an Immutable Map of names to default values,
 * and extracts them from the command-line in the form `--argname value`.
 * There are no positional arguments extractd.
 *
 * @method argListMixin
 * @memberof module:cli
 * @param argDefaultMap {Map} an Immutable Map of arg String names to default values.
 *   If there are no default values, pass in nothing to populate a map from CLI args.
 * @return {Function} a function taking no input state and returning a map of
 *         the names in `argList` as keys and corresponding positional command-line args
 *         as values.
 */
exports.createArgListTransform = function (argTypes) { return exports.createTransformFromMap({
    func: function (defaultArgs) { return __awaiter(void 0, void 0, void 0, function () {
        var scriptName, scriptArgs, found, args, argMap, key, value, floatVal, intVal, convertedVal, defaultArgsFilled, finalArgMap;
        return __generator(this, function (_a) {
            LOGGER.debug('state', defaultArgs);
            LOGGER.debug('args', process.argv);
            scriptName = path.basename(module.filename);
            scriptArgs = List(process.argv).skipUntil(function (x) { return x.startsWith('--'); });
            found = true;
            args = scriptArgs;
            argMap = new Map({});
            while (args.count() >= 2 && found) {
                if (args.get(0).startsWith('--')) {
                    key = args.get(0).slice(2);
                    if (!args.get(1).startsWith('--')) {
                        value = args.get(1);
                        floatVal = parseFloat(value);
                        intVal = parseInt(value);
                        convertedVal = value.startsWith('0x') ? value :
                            Number.isFinite(floatVal) ? floatVal :
                                Number.isInteger(intVal) ? intVal : value;
                        argMap = argMap.set(key, convertedVal);
                        LOGGER.debug("found arg " + key + "=" + convertedVal);
                        args = args.slice(2);
                    }
                    else {
                        argMap = argMap.set(key, true);
                        LOGGER.debug("found binary arg " + key);
                        args = args.slice(1);
                    }
                    found = true;
                }
                else {
                    LOGGER.warn("Ignoring positional args " + args);
                    found = false;
                }
            }
            defaultArgsFilled = Map(defaultArgs).map(function (defaultVal, name, a) { return (argMap.get(name) || defaultVal); });
            finalArgMap = argMap.merge(defaultArgsFilled);
            LOGGER.debug('finalArgMap', finalArgMap);
            return [2 /*return*/, finalArgMap];
        });
    }); },
    inputTypes: argTypes,
    outputTypes: argTypes,
}); };
exports.makeList = function (_list) {
    return List.isList(_list) ? _list : (Array.isArray(_list) ? List(_list) : List([_list]));
};
exports.isTransform = function (_obj) {
    return _obj['transform'] || (List.isList(_obj) && _obj.reduce(function (s, v) { return Boolean(s || v['transform']); }));
};
/**
 * Runner for a main function that takes a list of mixins to extract, process,
 * and return state. Agnostic to whether the main function is async or not.
 *
 * @method run
 * @memberof module:cli
 * @param mainFunc {Function} a callback function which takes in an immutable {Map} of
 *   state from the last mixin.
 * @param mixinList an Immutable {List} of mixin functions that take in an Immutable `Map`
 *   of input state from the previous mixin and return an Immutable `Map` of output state
 *   to the next mixin.
 * @return Immutable {Map} merging all output states of each mixin sequentially and finally
 *   mainFunc.
 */
exports.runTransforms = function (_transformList, _initialState) {
    if (_initialState === void 0) { _initialState = Map({}); }
    return __awaiter(void 0, void 0, void 0, function () {
        var callablePipeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LOGGER.debug('Running a pipeline on initial state', _initialState);
                    callablePipeline = exports.assembleCallablePipeline(_transformList);
                    assert(callablePipeline.pipeline);
                    return [4 /*yield*/, callablePipeline(_initialState)
                        /*
                        const valuesMap = await callablePipeline(_initialState)
                        assert( Map.isMap( callablePipeline.pipeline.mergedOutputTypes ),
                               'Pipeline does not have mergedOutputTypes' )
                        
                        valuesMap.mergedOutputTypes = callablePipeline.pipeline.mergedOutputTypes
                        valuesMap.pipeline = callablePipeline.pipeline
                        return valuesMap
                       */
                    ];
                case 1: return [2 /*return*/, _a.sent()
                    /*
                    const valuesMap = await callablePipeline(_initialState)
                    assert( Map.isMap( callablePipeline.pipeline.mergedOutputTypes ),
                           'Pipeline does not have mergedOutputTypes' )
                    
                    valuesMap.mergedOutputTypes = callablePipeline.pipeline.mergedOutputTypes
                    valuesMap.pipeline = callablePipeline.pipeline
                    return valuesMap
                   */
                ];
            }
        });
    });
};
exports.assembleCallablePipeline = function (_transformList) {
    var transformList = exports.makeList(_transformList);
    assert(List.isList(transformList));
    assert(transformList.count() >= 1);
    var firstPipe = new pipeline_1.PipeHead(exports.makeList(transformList.first()));
    var finalPipeline = transformList.slice(1).reduce(function (pipeSoFar, transform, i) {
        assert(exports.isTransform(transform), "Item " + i + " is not a transform");
        return pipeSoFar.append(exports.makeList(transform));
    }, firstPipe);
    return pipeline_1.createPipeline(finalPipeline);
};
