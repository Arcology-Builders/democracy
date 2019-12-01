pragma solidity >=0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import './ParamUtils.sol';
import './libs/NoteUtils.sol';

contract TradeValidator {
    using NoteUtils for bytes;
    using SafeMath for uint256;

    uint256 public chainId;

    bytes2 public constant MAGIC_BYTES = 0x1901;

    bytes32 public constant SALT = 0x655a1a74fefc4b03038d941491a1d60fc7fbd77cf347edea72ca51867fb5a3dc;

    string public constant TRADE_TYPE = "Trade(address bidderAddress,address sellerAddress,address bidderTokenAddress,address sellerTokenAddress,bytes32 bidderInputNoteHash,bytes32 sellerOutputNoteHash,bytes32 sellerInputNoteHash,bytes32 bidderOutputNoteHash,uint256 bidExpireBlockNumber,uint256 saleExpireBlockNumber)";
    bytes32 public constant TRADE_TYPEHASH = keccak256(abi.encodePacked(TRADE_TYPE));

    string public constant EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)";
    bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 public sellerInputNoteHash;
    bytes32 public bidderOutputNoteHash;
    bytes32 public bidderInputNoteHash;
    bytes32 public sellerOutputNoteHash;

    constructor(uint256 _chainId) public {
        chainId = _chainId;
    }

    function getNotes(
        bytes memory _proof
    ) public pure returns (bytes memory, bytes memory, address) {
        (bytes memory inputNotes, bytes memory outputNotes, address owner,) =  _proof.extractProofOutput();
        return (inputNotes, outputNotes, owner);
    }

    function getLength(
        bytes memory _proof
    ) public pure returns (uint256) {
        return _proof.getLength();
    }

    function extractAndVerifyNoteHashes(
        bytes memory _sellerProof,
        bytes memory _bidderProof
    ) public pure returns (uint256, uint256, uint256, uint256) {
        (bytes memory sellerInputNotes, bytes memory bidderOutputNotes, ,) = _sellerProof.extractProofOutput();
        (bytes memory bidderInputNotes, bytes memory sellerOutputNotes, ,) = _bidderProof.extractProofOutput();

        return (sellerInputNotes.getLength(), bidderOutputNotes.getLength(), bidderInputNotes.getLength(), sellerOutputNotes.getLength());
/*
        (address sellerInputAddress , bytes32 _sellerInputNoteHash ,) = sellerInputNotes.get(0).extractNote();
        (address bidderOutputAddress, bytes32 _bidderOutputNoteHash,) = bidderOutputNotes.get(0).extractNote();
        (address bidderInputAddress , bytes32 _bidderInputNoteHash ,) = bidderInputNotes.get(0).extractNote();
        (address sellerOutputAddress, bytes32 _sellerOutputNoteHash,) = sellerOutputNotes.get(0).extractNote();

        require( sellerInputAddress == sellerOutputAddress, "Seller addresses don't match between input and output" );
        require( bidderInputAddress == bidderOutputAddress, "Bidder addresses don't match between input and output" );

        sellerInputNoteHash  = _sellerInputNoteHash;
        bidderOutputNoteHash = _bidderOutputNoteHash;
        bidderInputNoteHash  = _bidderInputNoteHash;
        sellerOutputNoteHash = _sellerOutputNoteHash;

        return (sellerInputNoteHash, bidderOutputNoteHash, bidderInputNoteHash, sellerOutputNoteHash);
*/
    }

    function extractAndVerify(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProof,
        bytes memory _bidderProof
    ) public view returns (bool) {

        //(
        //    bytes32 sellerInputNoteHash,
        //    bytes32 bidderOutputNoteHash,
        //    bytes32 bidderInputNoteHash,
        //    bytes32 sellerOutputNoteHash
        //) =
        extractAndVerifyNoteHashes(_sellerProof, _bidderProof);

        bytes32 sigR = ParamUtils.getBytes32(_bidderParams, 62);
        bytes32 sigS = ParamUtils.getBytes32(_bidderParams, 84);
        uint8 sigV   = uint8(_bidderParams[95] & 0xFF);

        address bidderAddress = ParamUtils.getAddress(_bidderParams, 20);
        bytes32 hash = hashMessage(
          _bidderParams,
          _sellerParams,
          sellerInputNoteHash,
          bidderOutputNoteHash,
          bidderInputNoteHash,
          sellerOutputNoteHash
        );
        return bidderAddress == ecrecover(hash, sigV, sigR, sigS);
    }

    function getDomainSeparator() public view returns (bytes32 _domainSeparator) {
        return keccak256(abi.encodePacked(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("Democracy.js Linked Trade Validator"),
            keccak256("1"),
            chainId,
            address(this),
            SALT
        ));
    }

    function hashMessage(
        bytes memory _bidderParams,
        bytes memory _sellerParams,
        bytes32 _sellerInputNoteHash,
        bytes32 _bidderOutputNoteHash,
        bytes32 _bidderInputNoteHash,
        bytes32 _sellerOutputNoteHash
    ) public view returns (bytes32) {

        address sellerTokenAddress    = ParamUtils.getAddress(_sellerParams, 0);
        address bidderTokenAddress    = ParamUtils.getAddress(_bidderParams, 0);
        address sellerAddress         = ParamUtils.getAddress(_sellerParams, 20);
        address bidderAddress         = ParamUtils.getAddress(_bidderParams, 20);

        // uint256's begin at the end and count back 32 bytes to 40
        uint256 saleExpireBlockNumber = ParamUtils.getUint256(_sellerParams, 72);
        uint256 bidExpireBlockNumber  = ParamUtils.getUint256(_bidderParams, 72);

        require( saleExpireBlockNumber > block.number, "Sale expiration block number should be in the future." );
        require( bidExpireBlockNumber  > block.number, "Bid expiration block number should be in the future." );

      return keccak256(abi.encodePacked(
            TRADE_TYPEHASH,
            bidderAddress,
            sellerAddress,
            bidderTokenAddress,
            sellerTokenAddress,
            _sellerInputNoteHash,
            _bidderOutputNoteHash,
            _bidderInputNoteHash,
            _sellerOutputNoteHash,
            bidExpireBlockNumber,
            saleExpireBlockNumber
        ));
    } 

    function hashTrade(
        bytes memory _bidderParams,
        bytes memory _sellerParams,
        bytes32 _sellerInputNoteHash,
        bytes32 _bidderOutputNoteHash,
        bytes32 _bidderInputNoteHash,
        bytes32 _sellerOutputNoteHash
    ) public view returns (bytes32) {

        return keccak256(abi.encodePacked(
            MAGIC_BYTES,
            getDomainSeparator(),
            hashMessage(
                _bidderParams,
                _sellerParams,
                _sellerInputNoteHash,
                _bidderOutputNoteHash,
                _bidderInputNoteHash,
                _sellerOutputNoteHash
            )
        ));
    } 

}
