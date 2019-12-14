pragma solidity >= 0.4.22;

// Utilities for unpacking different parameters
// from a bytes array, useful for getting around
// Solidity's stack depth for local variables and parameters
// in function signature.
library ParamUtils {

    function getAddress(bytes memory _data, uint8 offset) public pure returns (address) {
        require( offset < _data.length, "Offset beyond bytes array length." );
        bytes20 first = 0;
        for (uint8 i = 0; i < 20; i++) {
            first |= bytes20(_data[i+offset] & 0xFF) >> (i*8);
        }
        return address(first);
    }

    function getBytes32(bytes memory _data, uint8 offset) public pure returns (bytes32) {
        // If offset >= data.length - 32,
        // it would mean a shorter than 32-byte quantity, or running off the end
        require( offset < (_data.length - 32), "Offset beyond bytes array length." );
        bytes32 first = 0;
        for (uint8 i = 0; i < 32; i++) {
            first |= bytes32(_data[i+offset] & 0xFF) >> (i*8);
        }
        return first;
    }

    // offset's for a uint256 is the ending index in the bytes array
    // so an offset of x means the uint256 (with zero padding) begins at index x-32
    function getUint256(bytes memory _data, uint8 offset) public pure returns (uint256) {
        // offset can be equal to _data.length if the uint256 ends exactly at the end
        // of the bytes array
        require( offset <= _data.length, "Offset beyond bytes array length." );
        uint[1] memory uints;
        assembly { mstore(uints, mload(add(_data, offset))) }
        return uints[0];
    }

    function getUint8(bytes memory _data, uint8 offset) public pure returns (uint8) {
        require( offset < _data.length, "Offset beyond bytes array length." );
        return uint8(_data[offset] & 0xFF);
    }

    /**
     * Copied from https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol#L228
     */
    function sliceBytes(
        bytes memory _bytes,
        uint _start,
        uint _end
    ) public pure returns (bytes memory)
    {
        require(_start < _end, "Start offset should be less than end offset.");
        uint _length = _end - _start;

        require(_end <= _bytes.length, "End offset should be less than bytes length." );

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
