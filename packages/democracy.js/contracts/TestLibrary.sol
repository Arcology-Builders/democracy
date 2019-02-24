pragma solidity >=0.4.22 <0.6.0;

library TestLibrary {
    function double(uint256 _def) public view returns (uint256 someVal) {
        return 2*_def;
    }
}
