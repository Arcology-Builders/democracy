pragma solidity >=0.5.0;

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

    function twoSidedTransfer(
        address _sellerTokenAddress,
        address _buyerTokenAddress,
        bytes memory _sellerProof,
        bytes memory _buyerProof,
        bytes memory _sellerSignatures,
        bytes memory _buyerSignatures
    ) public {
        ZkAssetMintable sellerToken = ZkAssetMintable(_sellerTokenAddress);
        ZkAssetMintable buyerToken = ZkAssetMintable(_buyerTokenAddress);
        sellerToken.confidentialTransfer(_sellerProof, _sellerSignatures);
        buyerToken.confidentialTransfer(_buyerProof, _buyerSignatures);
    }
}
