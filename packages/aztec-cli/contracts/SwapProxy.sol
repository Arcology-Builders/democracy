pragma solidity >=0.5.0;

import "./ParamUtils.sol";
import "./ZkAssetMintable.sol";
import "ACE/ACE.sol";
import "libs/NoteUtils.sol";
import "interfaces/IAZTEC.sol";

contract SwapProxy is IAZTEC {
    using NoteUtils for bytes;

    ACE public ace;

    constructor(
        address _aceAddress
    ) public {
        ace = ACE(_aceAddress);
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
        bytes memory _proofData,
        bytes memory _signature
    ) public {
        ZkAssetMintable token = ZkAssetMintable(_tokenAddress);
        token.confidentialTransfer(_proofData, _signature);
    }

    function twoSidedTransfer(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProofData,
        bytes memory _bidderProofData,
        bytes memory _sellerSignatures,
        bytes memory _bidderSignatures
    ) public {
        address sellerTokenAddress = ParamUtils.getAddress(_sellerParams, 0);
        address bidderTokenAddress = ParamUtils.getAddress(_bidderParams, 0);
        ZkAssetMintable sellerToken = ZkAssetMintable(sellerTokenAddress);
        ZkAssetMintable bidderToken = ZkAssetMintable(bidderTokenAddress);
        sellerToken.confidentialTransfer(_sellerProofData, _sellerSignatures);
        bidderToken.confidentialTransfer(_bidderProofData, _bidderSignatures);
    }

}
