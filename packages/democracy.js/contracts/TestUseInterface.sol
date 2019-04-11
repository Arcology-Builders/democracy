pragma solidity >=0.4.22 <0.6.0;

import "./TestInterface.sol";

contract TestUseInterface {

    uint256 public abc;

    constructor(uint256 _abc) public {
        abc = _abc;
    }

    function callInterface(uint256 _def) public pure returns (bool success) {
        require(TestInterface.internalFunc(_def));
        return true;
    }

}
