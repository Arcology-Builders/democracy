pragma solidity >=0.5.0;

import "./ParamUtils.sol";
import "ERC1724/ZkAssetMintable.sol";
import "ACE/ACE.sol";

contract SwapProxy {

    ACE public ace;

    constructor(address _aceAddress) public {
        ace = ACE(_aceAddress);
    }

    function oneSidedTransfer(
        address _tokenAddress,
        bytes memory _proof,
        bytes memory _signature
    ) public {
        ZkAssetMintable token = ZkAssetMintable(_tokenAddress);
        token.confidentialTransfer(_proof, _signature);
    }

    function getAddress(
        bytes memory _params
    ) public pure returns (address) {
        return ParamUtils.getAddress(_params, 0);
    }

    function linkedTransfer(
        bytes memory _sellerParams,
        bytes memory _bidderParams,
        bytes memory _sellerProof,
        bytes memory _bidderProof,
        bytes memory _sellerSignatures,
        bytes memory _bidderSignatures
    ) public {
        address sellerTokenAddress = ParamUtils.getAddress(_sellerParams, 0);
        address bidderTokenAddress = ParamUtils.getAddress(_bidderParams, 0);
        ZkAssetMintable sellerToken = ZkAssetMintable(sellerTokenAddress);
        ZkAssetMintable bidderToken = ZkAssetMintable(bidderTokenAddress);
        sellerToken.confidentialTransfer(_sellerProof, _sellerSignatures);
        bidderToken.confidentialTransfer(_bidderProof, _bidderSignatures);

        //bytes32 sellerNoteHash = ParamUtils.getBytes32(_sellerParams, 20);
        //bytes32 bidderNoteHash = ParamUtils.getBytes32(_bidderParams, 20);
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
