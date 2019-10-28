pragma solidity >= 0.5.0 <0.7.0;


import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAssetMintable.sol";
import "@aztec/protocol/contracts/ERC1724/ZkAsset.sol";


contract TestERC20 is ERC20 {
  function giveMeTokens(address _account, uint256 _value) public {
    _mint(_account, _value);
  }
}

contract TestZkAssetMintable is ZkAssetMintable {

}

contract TestZkAsset is ZkAsset {

}
