pragma solidity >=0.5.0;

import "./ParamUtils.sol";
import "./TradeValidator.sol";
import "./ZkAssetTradeable.sol";
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

    function extractAndRecover(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProofOutput,
        bytes memory _bidderProofOutput
    ) public view returns (address) {

        return tv.extractAndRecover(
            _sellerParams,
            _bidderParams,
            _sellerProofOutput,
            _bidderProofOutput
        );
    }

    function verifyTrade(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProofOutput,
        bytes memory _bidderProofOutput
    ) public view returns (bool) {

        return tv.verifyTrade(
            _sellerParams,
            _bidderParams,
            _sellerProofOutput,
            _bidderProofOutput
        );
    }

    function linkedTransfer(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProofOutputs,
        bytes memory _bidderProofOutputs,
        bytes memory _sellerSignatures,
        bytes memory _bidderSignatures,
        bytes memory _sellerProofData,
        bytes memory _bidderProofData
    ) public {

        bytes memory sellerProofOutput = _sellerProofOutputs.get(0);
        bytes memory bidderProofOutput = _bidderProofOutputs.get(0);

        // First check and fail early if trade is not valid
        bool isValid = tv.verifyTrade(
            _sellerParams,
            _bidderParams,
            sellerProofOutput,
            bidderProofOutput
        );
        require( isValid, "Invalid trade signature for bidder." );

        address transferer = ParamUtils.getAddress(_sellerParams, 72); 
        address sellerTokenAddress = ParamUtils.getAddress(_sellerParams, 20);
        address bidderTokenAddress = ParamUtils.getAddress(_bidderParams, 20);
        ZkAssetTradeable sellerToken = ZkAssetTradeable(sellerTokenAddress);
        ZkAssetTradeable bidderToken = ZkAssetTradeable(bidderTokenAddress);
        sellerToken.confidentialTrade(
            _sellerProofOutputs,
            _sellerSignatures,
            _sellerProofData,
            transferer
        );
        bidderToken.confidentialTrade(
            _bidderProofOutputs,
            _bidderSignatures,
            _bidderProofData,
            transferer
        );
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
        ZkAssetTradeable sellerToken = ZkAssetTradeable(sellerTokenAddress);
        ZkAssetTradeable bidderToken = ZkAssetTradeable(bidderTokenAddress);
        sellerToken.confidentialTransfer(_sellerProofData, _sellerSignatures);
        bidderToken.confidentialTransfer(_bidderProofData, _bidderSignatures);
    }

}
