pragma solidity >= 0.4.22;

library ParamUtils {

    function getAddress(bytes memory _data, uint8 offset) public pure returns (address) {
       bytes20 first = 0;
       for (uint8 i = 0; i < 20; i++) {
           first |= bytes20(_data[i+offset] & 0xFF) >> (i*8);
       }
       return address(first);
    }

    function getBytes32(bytes memory _data, uint8 offset) public pure returns (bytes32) {
       bytes32 first = 0;
       for (uint8 i = 0; i < 32; i++) {
           first |= bytes32(_data[i+offset] & 0xFF) >> (i*8);
       }
       return first;
    }

    function getUint256(bytes memory _data, uint8 offset) public pure returns (uint256) {
       uint[1] memory uints;
       assembly { mstore(uints, mload(add(_data, offset))) }
       return uints[0];
    }

    /**
     * Copied from https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol#L228
     */
    function sliceBytes(
        bytes memory _bytes,
        uint _start
    ) public pure returns (bytes memory)
    {
        require(_start <= _bytes.length, "Start offset should be less than length." );
        uint _length = _bytes.length - _start;

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                tempBytes := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(_length, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                let end := add(mc, _length)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(tempBytes, _length)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                tempBytes := mload(0x40)

                mstore(0x40, add(tempBytes, 0x20))
            }
        }

        return tempBytes;
    }

}
