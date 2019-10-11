"use strict";
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
var chai_1 = require("chai");
var utils_1 = require("./utils");
var ArgTypeEnum;
(function (ArgTypeEnum) {
    ArgTypeEnum["STRING"] = "string";
    ArgTypeEnum["NUMBER"] = "number";
    ArgTypeEnum["BOOLEAN"] = "boolean";
    ArgTypeEnum["MAP"] = "ImmutableMap";
    ArgTypeEnum["LIST"] = "ImmutableList";
})(ArgTypeEnum = exports.ArgTypeEnum || (exports.ArgTypeEnum = {}));
exports.makeRequired = function (checkerFunc, typeName) {
    var callable = checkerFunc;
    callable.typeName = typeName;
    return callable;
};
exports.makeOptional = function (checkerFunc, typeName) {
    var callable = function (obj) { return ((obj === undefined) || checkerFunc(obj)); };
    callable.typeName = typeName + '?';
    return callable;
};
// Standard arg types / checkers
var BASE_TYPES = immutable_1.default.Map({
    'string': function (arg) { return (typeof (arg) === 'string'); },
    'number': function (arg) { return (typeof (arg) === 'number'); },
    'boolean': function (arg) { return (typeof (arg) === 'boolean'); },
    'map': function (arg) { return (immutable_1.default.Map.isMap(arg)); },
    'list': function (arg) { return (immutable_1.default.List.isList(arg)); },
    'badType': function (arg) { return false; },
    'any': function (arg) { return true; },
    'integer': function (arg) { return Number.isInteger(arg); },
    'float': function (arg) { return typeof (parseFloat(arg)) === 'number'; },
});
exports.TYPES_MAP = BASE_TYPES.map(function (checker, typeName) {
    var requiredChecker = exports.makeRequired(checker, typeName);
    requiredChecker.opt = exports.makeOptional(checker, typeName);
    return requiredChecker;
});
exports.TYPES = exports.TYPES_MAP.toJSON();
/*
export const TYPE = (typeString : string): ArgCheckers =>
  Immutable.List(typeString.split('|').map(t => (TYPES[t] || TYPES.badType)))
const argCheckerSafe = (argType: string): ArgChecker => {
    const argChecker = argCheckerMap[argType]
    if (argChecker != undefined) { return argChecker }
    else { return () => false }
}
*/
//const argCheckers: ArgCheckers = Immutable.Map(argCheckerMap)
exports.checkExtractArgs = function (args, argTypes) {
    return argTypes.map(function (argType, argName) {
        var argCheckers = immutable_1.default.List([argType]);
        var arg = args.get(argName); // could be undefined
        var argIsCorrectType = argCheckers.reduce(function (orResult, checker, i, checkers) { return Boolean(orResult || checker(arg)); }, false);
        chai_1.assert(argIsCorrectType, arg + " did not have type " + argTypes + " for arg name " + argName);
        return arg;
    });
};
var Transform = /** @class */ (function () {
    function Transform(func, inputTypes, outputTypes, cacheable) {
        this.func = func;
        this.inputTypes = inputTypes;
        this.outputTypes = outputTypes;
        var hashObj = {
            func: func,
            inputTypes: inputTypes,
            outputTypes: outputTypes
        };
        this.cacheable = cacheable || false;
        this.contentHash = new utils_1.Keccak256Hash(hashObj);
    }
    Transform.prototype.toString = function () {
        return 'Transform';
    };
    return Transform;
}());
exports.Transform = Transform;
exports.createTransform = function (transform) {
    var callable = function (state) { return __awaiter(void 0, void 0, void 0, function () {
        var inputArgs, output, outputArgs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inputArgs = exports.checkExtractArgs(state, transform.inputTypes);
                    return [4 /*yield*/, transform.func(inputArgs.toJS())];
                case 1:
                    output = _a.sent();
                    outputArgs = exports.checkExtractArgs(output, transform.outputTypes);
                    return [2 /*return*/, output];
            }
        });
    }); };
    callable.transform = transform;
    return callable;
};
var createOutputTypes = function (outLabel) {
    var outMap = {};
    outMap[outLabel ? outLabel : 'sum'] = exports.TYPES.number;
    return immutable_1.default.Map(outMap);
};
exports.createInitialTransform = function (initialState, types) {
    // Initial input func is just a dummy that returns initial state and doesn't need anything
    // from the input state
    var func = function (initialArgs) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Actual args override defaults
            return [2 /*return*/, new Promise(function (resolve) { return resolve(initialState.mergeDeep(initialArgs)); })];
        });
    }); };
    return exports.createTransform({
        func: func,
        inputTypes: types,
        outputTypes: types,
        cacheable: false,
        contentHash: new utils_1.Keccak256Hash(func),
    });
};
exports.ADD_INPUT_TYPES = immutable_1.default.Map({ firstArg: exports.TYPES.number, secondArg: exports.TYPES.number });
exports.createAddTransform = function (outLabel) {
    var func = function (_a) {
        var firstArg = _a.firstArg, secondArg = _a.secondArg;
        return __awaiter(void 0, void 0, void 0, function () {
            var outMap;
            return __generator(this, function (_b) {
                outMap = {};
                outMap[outLabel ? outLabel : 'sum'] = Number(firstArg) + Number(secondArg);
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () { return resolve(immutable_1.default.Map(outMap)); }, 500);
                    })];
            });
        });
    };
    return exports.createTransform({
        func: func,
        inputTypes: exports.ADD_INPUT_TYPES,
        outputTypes: createOutputTypes(outLabel),
        cacheable: false,
        contentHash: new utils_1.Keccak256Hash(func),
    });
};
