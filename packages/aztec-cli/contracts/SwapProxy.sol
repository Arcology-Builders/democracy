pragma solidity >=0.5.0;

import "./ParamUtils.sol";
import "./TradeValidator.sol";
import "ERC1724/ZkAssetMintable.sol";
import "ACE/ACE.sol";
import "libs/NoteUtils.sol";
import "interfaces/IAZTEC.sol";

contract SwapProxy is IAZTEC {
    using NoteUtils for bytes;

    ACE public ace;
    TradeValidator public tv;

    constructor(
        address _aceAddress,
        address _tvAddress
    ) public {
        ace = ACE(_aceAddress);
        tv = TradeValidator(_tvAddress);
    }

    function getNotes(
        bytes memory _proofData,
        address _signer
    ) public returns (bytes memory) {
        bytes memory _proofOutputs = ace.validateProof(JOIN_SPLIT_PROOF, _signer, _proofData);
        return _proofOutputs;
        //return _proofOutputs.get(0).extractProofOutput();
    }

    function oneSidedTransfer(
        address _tokenAddress,
        bytes memory _proof,
        bytes memory _signature
    ) public {
        ZkAssetMintable token = ZkAssetMintable(_tokenAddress);
        token.confidentialTransfer(_proof, _signature);
    }


    function linkedTransfer(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProof,
        bytes memory _bidderProof,
        bytes memory _sellerSignatures,
        bytes memory _bidderSignatures
    ) public {
        address sellerTokenAddress = ParamUtils.getAddress(_sellerParams, 20);
        address bidderTokenAddress = ParamUtils.getAddress(_bidderParams, 20);
        ZkAssetMintable sellerToken = ZkAssetMintable(sellerTokenAddress);
        ZkAssetMintable bidderToken = ZkAssetMintable(bidderTokenAddress);
        bool isValid = tv.verifyTrade(
            _sellerParams,
            _bidderParams,
            _sellerProof,
            _bidderProof
        );
        require( isValid, "Invalid trade signature for bidder." );

        sellerToken.confidentialTransfer(_sellerProof, _sellerSignatures);
        bidderToken.confidentialTransfer(_bidderProof, _bidderSignatures);
    }

    function twoSidedTransfer(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProof,
        bytes memory _bidderProof,
        bytes memory _sellerSignatures,
        bytes memory _bidderSignatures
    ) public returns (bytes32,bytes32) {
        address sellerTokenAddress = ParamUtils.getAddress(_sellerParams, 0);
        address bidderTokenAddress = ParamUtils.getAddress(_bidderParams, 0);
        ZkAssetMintable sellerToken = ZkAssetMintable(sellerTokenAddress);
        ZkAssetMintable bidderToken = ZkAssetMintable(bidderTokenAddress);
        sellerToken.confidentialTransfer(_sellerProof, _sellerSignatures);
        bidderToken.confidentialTransfer(_bidderProof, _bidderSignatures);

        bytes32 sellerNoteHash = ParamUtils.getBytes32(_sellerParams, 20);
        bytes32 bidderNoteHash = ParamUtils.getBytes32(_bidderParams, 20);
        return (sellerNoteHash,bidderNoteHash);
    }

}
