pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./ZkAsset.sol";
import "./ACE/ACE.sol";
import "./ERC20/ERC20Mintable.sol";
import "./interfaces/IAZTEC.sol";
import "./libs/LibEIP712.sol";
import "./libs/ProofUtils.sol";
import "./ZkAssetMintable.sol";
import "./ParamUtils.sol";

/**
 * @title ZkAssetTradeable
 * @author Paul Pham
 * @dev A contract defining the standard interface and behaviours of a confidential tradeable asset. 
 * Inherits from ZkAssetMintable, only overrides confidentialTransfer
 * Copyright Democracy.js 2019. All rights reserved.
**/

contract ZkAssetTradeable is ZkAssetMintable {
    event UpdateTotalMinted(bytes32 noteHash, bytes noteData);
    address public owner;

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public ZkAssetMintable(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        _canAdjustSupply,
        _canConvert
    ) {
        owner = msg.sender;
    }

    /**
    * @dev Executes one side of a confidential trade of AZTEC notes using a cached validated
    * proof only.

    * Accepts _proofOutput, so that multiple trades can be batched together,
    * and submits them to the validateProofByHash() function of the Cryptography Engine
    * to enable gas-free validation and make use of previous validation by
    * seller and bidder (required).
    *
    * Currently only supports one proof
    * TODO: loop over all proofs to validateProofByHash
    * Copied from ZkAssetMintable.confidentialTransfer in aztec/protocol 0.9.1
    * changing _proofData to _proofOutputs. In 1.0.0 version, we can make use of
    * confidentialTransferInternal.
    *
    * Upon successful completion, it will update note registry states, making
    * the new output nodes spendable by seller and bidder and destroying the
    * old input notes.
    * 
    * @param _proofOutputs - bytes variable outputted from proof construction
    *   as `expectedOutput`.
    */
    function confidentialTrade(
        bytes memory _proofOutputs,
        bytes memory _signatures,
        bytes memory _proofData,
        address _transferer
    ) public {

        bytes memory proofOutput = _proofOutputs.get(0); 
        bytes memory formattedProofOutput = ParamUtils.sliceBytes(proofOutput, 32);
        bytes32 proofHash = keccak256(formattedProofOutput);
        
        require( ace.validateProofByHash(
            JOIN_SPLIT_PROOF, proofHash, _transferer
            ), "proof output is invalid for confidential transfer" );

        (,
        ,
        ,
        int256 publicValue) = proofOutput.extractProofOutput();

        (
            ,
            uint256 scalingFactor,
            uint256 totalSupply,
            ,
            ,
            ,
        ) = ace.getRegistry(address(this));
        if (publicValue > 0) {
            if (totalSupply < uint256(publicValue)) {
                uint256 supplementValue = uint256(publicValue).sub(totalSupply);
                ERC20Mintable(address(linkedToken)).mint(address(this), supplementValue.mul(scalingFactor));
                ERC20Mintable(address(linkedToken)).approve(address(ace), supplementValue.mul(scalingFactor));

                ace.supplementTokens(supplementValue);
            }
        }
        // It seems like there should be a confidentialBurn here too

        confidentialTransferInternal(_proofOutputs, _signatures, _proofData);
    }
}

