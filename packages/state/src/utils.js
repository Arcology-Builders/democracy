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
exports.__esModule = true;
var ethereumjs_util_1 = require("ethereumjs-util");
var chai_1 = require("chai");
var Keccak256Hash = /** @class */ (function (_super) {
    __extends(Keccak256Hash, _super);
    function Keccak256Hash(objectToHash) {
        var _this = _super.call(this) || this;
        _this.toString = function () {
            return _this.hashBuffer.toString('hex');
        };
        _this.hashBuffer = Buffer.from(ethereumjs_util_1.keccak256(JSON.stringify(objectToHash)));
        return _this;
    }
    return Keccak256Hash;
}(Object));
exports.Keccak256Hash = Keccak256Hash;
var EthereumAddress = /** @class */ (function (_super) {
    __extends(EthereumAddress, _super);
    function EthereumAddress(publicKey) {
        var _this = _super.call(this) || this;
        var prefixedPublicKey = (publicKey.slice(0, 2) !== '0x') ? '0x' + publicKey : publicKey;
        chai_1.assert.equal(prefixedPublicKey.length, 134, "Public key has incorrect length");
        _this.prefixedPublicKey = prefixedPublicKey;
        _this.prefixedAddress = ethereumjs_util_1.toChecksumAddress(ethereumjs_util_1.pubToAddress(Buffer.from(prefixedPublicKey.slice(2), 'hex')).toString('hex'));
        chai_1.assert(ethereumjs_util_1.isValidChecksumAddress(_this.prefixedAddress));
        return _this;
    }
    EthereumAddress.prototype.TYPE = function (obj) {
        return (obj instanceof EthereumAddress) && ethereumjs_util_1.isValidChecksumAddress(obj.prefixedAddress);
    };
    return EthereumAddress;
}(Object));
exports.EthereumAddress = EthereumAddress;
