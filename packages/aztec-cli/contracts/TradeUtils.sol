pragma solidity >=0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./ParamUtils.sol";
import "./libs/NoteUtils.sol";

library TradeUtils {
    using NoteUtils for bytes;
    using SafeMath for uint256;

    function getProofOutput(
        bytes memory _proofOutputs,
        uint8 _index
    ) public pure returns (bytes memory) {

        // Based on the line in aztec.js outputCoder
        // const offset = parseInt(proofOutputs.slice(0x40 + 0x40 * i, 0x80 + 0x40 * i), 16);
        // Offsets in hex characters are twice what they are in bytes
        // we retrieve Uint256's from their ending offset (hence adding an additional 0x20)

        // Only supports small offsets (8-bit)
        uint256 offset = ParamUtils.getUint256(_proofOutputs, 0x20 + (0x20 * _index) + 0x20);

        require( offset < 255, "Offset should fit into 8 bits." );
        uint8 offset8 = uint8(offset & 0xFF);

        // const length = parseInt(proofOutputs.slice(offset * 2 - 0x40, offset * 2), 16);

        uint256 length = ParamUtils.getUint256(_proofOutputs, offset8);

        return ParamUtils.sliceBytes(_proofOutputs, offset8 - 0x20, offset8 + length);
    }

    function getFirstProofOutput(
        bytes memory _proofOutputs
    ) public pure returns (bytes memory) {
        return getProofOutput(_proofOutputs, 0);
    }

    function extractProofOutput(
        bytes memory _proofOutput
    ) public pure returns (bytes memory _inputNotes, bytes memory _outputNotes, address _owner, int256 _publicValue) {
        return _proofOutput.extractProofOutput();
    }

    function hashValidatedProof(
        bytes memory _formattedProofOutput
    ) public pure returns (bytes32) {
        return keccak256(_formattedProofOutput);
    }

    function getNote(
        bytes memory _notes,
        uint8 _index
    ) public pure returns (bytes memory) {
        return _notes.get(_index);
    }

    function getLength(
        bytes memory _proofOutputsOrNotes
    ) public pure returns (uint256) {
        return _proofOutputsOrNotes.getLength();
    }

    function recoverAddress(
         bytes32 _hash,
         bytes32 _sigR,
         bytes32 _sigS,
         uint8 _sigV
    ) public pure returns (address) {
        return ecrecover(_hash, _sigV, _sigR, _sigS);
    }

}
