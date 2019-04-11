pragma solidity >=0.4.22 <0.6.0;

library TestLibrary2 {
    function triple(uint256 _def) public pure returns (uint256 someVal) {
        return 3*_def;
    }
}
