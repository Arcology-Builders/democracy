pragma solidity >=0.4.22 <0.6.0;

import "./TestLibrary.sol";
import "./TestLibrary2.sol";

contract TestUseLibrary2 {

    uint256 public def;

    constructor(uint256 _abc) public {
        def = TestLibrary.double(_abc);
    }

    function double(uint256 _def) public view returns (uint256) {
        return 2*_def;
    }

    function triple(uint256 _ghi) public view returns (uint256) {
        return TestLibrary2.triple(_ghi);
    }

    function() payable {
    }

}
