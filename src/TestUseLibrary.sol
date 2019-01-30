pragma solidity >=0.4.22 <0.6.0;

import "./TestLibrary.sol";

contract TestUseLibrary {

    uint256 public def;

    constructor(uint256 _abc) public {
        def = TestLibrary.double(_abc);
    }
}
