pragma solidity ^0.4.11;

contract GetSet {

  uint256 public a;

  function setA(uint256 _a) public {
    a = _a;
  }

  function getA() public constant returns(uint256) {
    return a;
  }

}
