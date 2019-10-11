"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var Immutable = require("immutable");
var chai_1 = require("chai");
var transform_1 = require("./transform");
var utils_1 = require("./utils");
exports.isSubset = function (a, b) {
    return a.reduce(function (s, val, key, a) {
        var aTypes = Immutable.Set([val.typeName]);
        var bTypes = Immutable.Set([(b.get(key) || transform_1.TYPES.badType).typeName]);
        return Boolean(s && (aTypes.isSubset(bTypes) || val(undefined)));
    }, true);
};
var PipeHead = /** @class */ (function () {
    function PipeHead(lastCallables) {
        var _this = this;
        this.toString = function () {
            return JSON.stringify({
                lastCallables: _this.lastCallables.map(function (x) { return x.transform.toString(); }).toJS(),
                contentHash: _this.contentHash.toString(),
                traverseList: _this.traverseList.map(function (t) { return t.contentHash; }),
            });
        };
        this.lastCallables = lastCallables;
        this.prev = this;
        this.cacheable = lastCallables.reduce(function (s, v, k, a) { return s && v.transform.cacheable; }, Boolean(true));
        // More needs to be added to this later
        var hashObj = Immutable.fromJS({
            lastCallables: lastCallables,
        });
        this.contentHash = new utils_1.Keccak256Hash(hashObj);
        this.mergedInputTypes = lastCallables.reduce(function (s, v, k, a) { return s.mergeDeep(v.transform.inputTypes); }, Immutable.Map({}));
        this.mergedOutputTypes = lastCallables.reduce(function (s, v, k, a) { return s.mergeDeep(v.transform.outputTypes); }, Immutable.Map({}));
        this.traverseList = Immutable.List([this]);
    }
    PipeHead.prototype.append = function (newCallables) {
        var outputTypes = newCallables.reduce(function (s, v, k, a) { return s.mergeDeep(v.transform.outputTypes); }, Immutable.Map({}));
        var inputTypes = newCallables.reduce(function (s, v, k, a) { return s.mergeDeep(v.transform.inputTypes); }, Immutable.Map({}));
        chai_1.assert(exports.isSubset(inputTypes, this.mergedOutputTypes), "Input types of new transform " + inputTypes.map(function (v, k) { return v.typeName; }) + " " +
            ("is not a subset of output types of last transform " + this.mergedOutputTypes.map(function (v, k) { return v.typeName; })));
        return new PipeAppended(newCallables, this);
    };
    return PipeHead;
}());
exports.PipeHead = PipeHead;
var PipeAppended = /** @class */ (function (_super) {
    __extends(PipeAppended, _super);
    function PipeAppended(callables, prev) {
        var _this = _super.call(this, callables) || this;
        _this.prev = prev;
        _this.traverseList = prev.traverseList.push(_this);
        // This seems somewhat redundant with super class above
        var mergedOutputTypes = callables.reduce(function (s, v, k, a) { return s.mergeDeep(v.transform.outputTypes); }, Immutable.Map({}));
        _this.mergedOutputTypes = prev.mergedOutputTypes.mergeDeep(mergedOutputTypes);
        return _this;
    }
    return PipeAppended;
}(PipeHead));
exports.PipeAppended = PipeAppended;
/*
const pipelineGenerator = async function* (head: Pipeline, initialState: Args) {
  let inState = initialState
  let current = head
  do {
    let outState = await current.lastCallable(inState)
    const mergedState = inState.mergeDeep(outState)
    yield mergedState
    inState = mergedState
    current = current.next
  } while (current)
}
*/
exports.createPipeline = function (pipeline) {
    var traverseList = pipeline.traverseList;
    var callable = function (initialState) { return __awaiter(void 0, void 0, void 0, function () {
        var inState, _i, _a, pipe, outState, checkedState;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    inState = initialState;
                    _i = 0, _a = traverseList.toJS();
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    pipe = _a[_i];
                    return [4 /*yield*/, pipe.lastCallables.reduce(function (s, v, k, a) { return __awaiter(void 0, void 0, void 0, function () {
                            var out, mergedOut;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, v(inState)];
                                    case 1:
                                        out = _a.sent();
                                        return [4 /*yield*/, s];
                                    case 2:
                                        mergedOut = (_a.sent()).mergeDeep(out);
                                        return [2 /*return*/, mergedOut];
                                }
                            });
                        }); }, inState)
                        // then later siblings in the line override earlier sibs
                    ]; // start all siblings to merge from same state
                case 2:
                    outState = _b.sent() // start all siblings to merge from same state
                    ;
                    checkedState = transform_1.checkExtractArgs(outState, pipe.mergedOutputTypes);
                    inState = inState.mergeDeep(checkedState);
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, inState];
            }
        });
    }); };
    callable.pipeline = pipeline;
    return callable;
};
