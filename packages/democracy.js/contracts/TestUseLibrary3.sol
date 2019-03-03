pragma solidity >=0.4.22 <0.6.0;

import "./TestLibrary.sol";
import "./TestDir/TestLibrary3.sol";

contract TestUseLibrary3 {

    uint256 public def;

    constructor(uint256 _abc) public {
        def = TestLibrary.double(_abc);
    }

    function double(uint256 _ghi) public returns (uint256) {
        // This version of double repeats a string twice
        def = TestLongLibraryName.double(_ghi);
        return def;
    }

    function getValue() public view returns (uint256) {
        return def;
    }

}
