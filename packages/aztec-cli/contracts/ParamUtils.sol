pragma solidity >= 0.4.22;

library ParamUtils {

    function getAddress(bytes memory _data, uint8 offset) public pure returns (address) {
       bytes20 first = 0;
       for (uint8 i = offset; i < 20; i++) {
           first |= bytes20(_data[i] & 0xFF) >> (i*8);
       }
       return address(first);
    }

    function getBytes32(bytes memory _data, uint8 offset) public pure returns (bytes32) {
       bytes32 first = 0;
       for (uint8 i = offset; i < 32; i++) {
           first |= bytes32(_data[i] & 0xFF) >> (i*8);
       }
       return first;
    }

    function getUint256(bytes memory _data, uint8 offset) public pure returns (uint256) {
       uint[1] memory uints;
       assembly { mstore(uints, mload(add(_data, offset))) }
       return uints[0];
    }

}
