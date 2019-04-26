pragma solidity >=0.4.22 <0.6.0;

import "./TestLibrary.sol";
import "./TestLibrary2.sol";

contract TestUseLibrary2 {

    uint256 public def;

    constructor(uint256 _abc) public {
        def = TestLibrary.double(_abc);
    }

    function double(uint256 _def) public returns (uint256) {
        //we modify state b/c Solidity return values don't travel through RPC
        def = 2*_def;
        return def;
    }

    function triple(uint256 _ghi) public returns (uint256) {
        def = TestLibrary2.triple(_ghi);
        return def;
    }

    function hextuple(uint256 _ghi) public returns (uint256) {
        def = 2*TestLibrary2.triple(_ghi);
        return def;
    }

    function getValue() public constant returns (uint256) {
        return def;
    }

    function() public payable {
    }

}
