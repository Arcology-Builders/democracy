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
var immutable_1 = require("immutable");
//const { Map: Map, List: List } = require('immutable')
var chai_1 = require("chai");
var runner_1 = require("../src/runner");
var __1 = require("..");
var _a = require('demo-utils'), immEqual = _a.immEqual, fromJS = _a.fromJS, getNetwork = _a.getNetwork, Logger = _a.Logger;
var wallet = require('demo-keys').wallet;
var LOGGER = new Logger('tests/runner');
describe('Runners', function () {
    it('creates an arglist mixin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var alm0, out0, out;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runner_1.createArgListTransform(immutable_1.Map({
                        'anotherThing': __1.DEMO_TYPES.integer,
                        'babaloo': __1.DEMO_TYPES.string,
                    }))];
                case 1:
                    alm0 = _a.sent();
                    return [4 /*yield*/, alm0(immutable_1.Map({
                            'anotherThing': 2,
                            'babaloo': 'eighteen'
                        }))];
                case 2:
                    out0 = _a.sent();
                    chai_1.assert.equal(out0.get('anotherThing'), 2);
                    chai_1.assert.equal(out0.get('babaloo'), 'eighteen');
                    // Test reading the argv's
                    process.argv.push('--anotherThing', '3', '--babaloo', '0x1010');
                    return [4 /*yield*/, alm0(immutable_1.Map({
                            'anotherThing': 2,
                            'babaloo': 'eighteen'
                        }))];
                case 3:
                    out = _a.sent();
                    chai_1.assert.equal(out.get('anotherThing'), 3);
                    chai_1.assert.equal(out.get('babaloo'), '0x1010');
                    return [2 /*return*/];
            }
        });
    }); });
    it('create a simple pipeline', function () { return __awaiter(void 0, void 0, void 0, function () {
        var alm2, dm, mainFunc, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runner_1.createArgListTransform(immutable_1.Map({
                        'anteater': __1.DEMO_TYPES.string,
                        'bugbear': __1.DEMO_TYPES.any,
                        'unlockSeconds': __1.DEMO_TYPES.integer,
                        'testAccountIndex': __1.DEMO_TYPES.integer,
                        'testValueETH': __1.DEMO_TYPES.string,
                    }))
                    /*
                      'anteater': 'c', 'bugbear': undefined,
                      'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1'
                     */
                ];
                case 1:
                    alm2 = _a.sent();
                    dm = runner_1.deployerTransform;
                    mainFunc = __1.createTransformFromMap({
                        func: function (_a) {
                            var chainId = _a.chainId, anteater = _a.anteater;
                            return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_b) {
                                    chai_1.assert.equal(chainId, '2222');
                                    chai_1.assert.equal(anteater, 'c');
                                    return [2 /*return*/, immutable_1.Map({
                                            chainId: '2222',
                                        })];
                                });
                            });
                        },
                        inputTypes: immutable_1.Map({
                            chainId: __1.DEMO_TYPES.string,
                            anteater: __1.DEMO_TYPES.string,
                        }),
                        outputTypes: immutable_1.Map({
                            chainId: __1.DEMO_TYPES.string,
                        }),
                    });
                    return [4 /*yield*/, runner_1.runTransforms(immutable_1.List([alm2]), immutable_1.Map({
                            anteater: 'aiai',
                            bugbear: false,
                            unlockSeconds: 2,
                            testAccountIndex: 5,
                            testValueETH: '0.2',
                        }))];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('creates a deployer transform', function () { return __awaiter(void 0, void 0, void 0, function () {
        var alm3, dm, out0, out1, actualId, expectedId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    alm3 = runner_1.createArgListTransform(immutable_1.Map({
                        'unlockSeconds': __1.DEMO_TYPES.integer,
                        'testAccountIndex': __1.DEMO_TYPES.integer,
                        'testValueETH': __1.DEMO_TYPES.string,
                        'deployerAddress': __1.DEMO_TYPES.ethereumAddress.opt,
                        'deployerPassword': __1.DEMO_TYPES.string.opt,
                    }));
                    dm = runner_1.deployerTransform;
                    return [4 /*yield*/, alm3(immutable_1.Map({
                            unlockSeconds: 1,
                            testAccountIndex: 0,
                            testValueETH: '0.1',
                            deployerAddress: undefined,
                            deployerPassword: undefined,
                        }))];
                case 1:
                    out0 = _a.sent();
                    return [4 /*yield*/, dm(out0)];
                case 2:
                    out1 = _a.sent();
                    chai_1.assert.equal(out1.get('deployerAddress').length, 42);
                    chai_1.assert.equal(out1.get('deployerPassword').length, 64);
                    return [4 /*yield*/, out1.get('deployerEth').net_version()];
                case 3:
                    actualId = _a.sent();
                    return [4 /*yield*/, getNetwork().net_version()];
                case 4:
                    expectedId = _a.sent();
                    chai_1.assert.equal(expectedId, actualId);
                    return [2 /*return*/];
            }
        });
    }); });
    it('preserves deployer address and password in deployer mixin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, address, password, alm, dm, out1, out;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, wallet.createEncryptedAccount()];
                case 1:
                    _a = _b.sent(), address = _a.address, password = _a.password;
                    return [4 /*yield*/, runner_1.createArgListTransform(immutable_1.Map({
                            'unlockSeconds': __1.DEMO_TYPES.integer,
                            'testAccountIndex': __1.DEMO_TYPES.integer,
                            'testValueETH': __1.DEMO_TYPES.string,
                            'deployerAddress': __1.DEMO_TYPES.ethereumAddress.opt,
                            'deployerPassword': __1.DEMO_TYPES.string.opt,
                        }))];
                case 2:
                    alm = _b.sent();
                    dm = runner_1.deployerTransform;
                    return [4 /*yield*/, alm(immutable_1.Map({
                            'unlockSeconds': 1,
                            'testAccountIndex': 0,
                            'testValueETH': '0.1',
                            'deployerAddress': address,
                            'deployerPassword': password,
                        }))];
                case 3:
                    out1 = _b.sent();
                    chai_1.assert.equal(out1.get('deployerAddress'), address);
                    chai_1.assert.equal(out1.get('deployerPassword'), password);
                    return [4 /*yield*/, dm(out1)];
                case 4:
                    out = _b.sent();
                    chai_1.assert.equal(out.get('deployerAddress'), address);
                    chai_1.assert.equal(out.get('deployerPassword'), password);
                    return [2 /*return*/];
            }
        });
    }); });
    it('merges a parallel list of mixins', function () { return __awaiter(void 0, void 0, void 0, function () {
        var siblingMixin, m2, m0, m1;
        return __generator(this, function (_a) {
            siblingMixin = function (keyPrefix, timeout) { return __1.createTransformFromMap({
                func: function (_a) {
                    var lastKey = _a.lastKey;
                    return __awaiter(void 0, void 0, void 0, function () {
                        var returnMap;
                        return __generator(this, function (_b) {
                            returnMap = {};
                            returnMap[keyPrefix + 'Address'] = '0x123';
                            returnMap[keyPrefix + 'Password'] = '0x456';
                            returnMap[keyPrefix + 'StartTime'] = Date.now();
                            returnMap['lastKey'] = keyPrefix;
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    setTimeout(function () {
                                        returnMap[keyPrefix + 'EndTime'] = Date.now();
                                        resolve(immutable_1.Map(returnMap));
                                    }, timeout);
                                })];
                        });
                    });
                },
                inputTypes: immutable_1.Map({
                    lastKey: __1.DEMO_TYPES.string,
                }),
                outputTypes: immutable_1.Map({ lastKey: __1.DEMO_TYPES.string })
                    .set(keyPrefix + 'Address', __1.DEMO_TYPES.string)
                    .set(keyPrefix + 'Password', __1.DEMO_TYPES.string)
                    .set(keyPrefix + 'StartTime', __1.DEMO_TYPES.number)
                    .set(keyPrefix + 'EndTime', __1.DEMO_TYPES.number),
            }); };
            m2 = __1.createTransformFromMap({
                func: function (_a) {
                    var senderEndTime = _a.senderEndTime, receiverEndTime = _a.receiverEndTime;
                    return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_b) {
                            return [2 /*return*/, immutable_1.Map({
                                    timeDiff: receiverEndTime - senderEndTime
                                })];
                        });
                    });
                },
                inputTypes: immutable_1.Map({
                    senderEndTime: __1.DEMO_TYPES.number,
                    receiverEndTime: __1.DEMO_TYPES.number,
                }),
                outputTypes: immutable_1.Map({ timeDiff: __1.DEMO_TYPES.number }),
            });
            chai_1.assert(m2.transform.inputTypes, m2.transform + " does not have inputTypes");
            m0 = siblingMixin('sender', 1000);
            m1 = siblingMixin('receiver', 1500);
            return [2 /*return*/];
        });
    }); });
    // Re-enable these tests when we support substate / map types in demo-state
    /*
      it( 'merges substates deeply', async () => {
        const subMixin = (keyPrefix, timeout, subStateLabel) => {
          return createTransform(new Transform(
            async ({ lastKey }) => {
              const returnMap = {}
              returnMap[keyPrefix + 'Address'] = '0x123'
              returnMap[keyPrefix + 'Password'] = '0x456'
              returnMap[keyPrefix + 'StartTime'] = Date.now()
              returnMap['lastKey'] = keyPrefix
              let out
              if (subStateLabel) {
                out = {}
                out[subStateLabel] = returnMap
              } else {
                out = returnMap
              }
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  returnMap[keyPrefix + 'EndTime'] = Date.now()
                  resolve(fromJS(out))
                }, timeout)
              })
            },
            Map({
              lastKey: TYPES.string,
            }),
            Map({ lastKey: TYPES.string })
              .set(keyPrefix + 'Address'  , TYPES.string)
              .set(keyPrefix + 'Password' , TYPES.string)
              .set(keyPrefix + 'StartTime', TYPES.number)
              .set(keyPrefix + 'EndTime'  , TYPES.number)
            ,
          ))
        }
    
        const m2 = createTransform( new Transform(
            async ({ sub: { senderEndTime } , bass: { receiverEndTime } }) => {
              return Map({
                lastKey : 'no im the only one',
                timeDiff: receiverEndTime - senderEndTime
              })
            },
            Map({
              'sub': TYPES.map,
              'bass': TYPES.map,
            }),
           Map({
              'lastKey': TYPES.string,
              'timeDiff': TYPES.number,
           })
        ) )
    
        const m0 = subMixin('sender'   , 1000, 'sub')
        const m1 = subMixin('receiver' , 1500, 'bass')
        const m3 = subMixin('niece'    , 500 , 'sub')
        const m4 = subMixin('nephew'   , 700 , 'bass')
    
        const finalState = await runTransforms(
          [ [ m0, m1 ], [ m3, m4 ], m2 ],
          Map({
            lastKey: '',
            sub: Map({}),
            bass: Map({}),
          }) )
    
        const sub = finalState.get('sub')
        const bass = finalState.get('bass')
    
        assert.equal(sub.get('senderAddress')   , '0x123')
        assert.equal(sub.get('nieceAddress')    , '0x123')
        assert.equal(bass.get('receiverAddress'), '0x123')
        assert.equal(bass.get('nephewAddress')  , '0x123')
        assert.equal(bass.get('ommerAddress')   , '0x123')
        assert(finalState.has('lastKey'))
        assert(bass.get('receiverEndTime')  - sub.get('senderEndTime') < 700)
        assert.equal(finalState.get('timeDiff'), bass.get('receiverEndTime')  - sub.get('senderEndTime'))
        assert.equal( finalState.count(), 5 )
        assert.equal( finalState.get('survivor'), 'I am', `Main state initial key does not survive parallel substates` )
      })
    */
});
