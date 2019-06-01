pragma solidity >=0.5.0;

contract Relink {

    uint256 public a;

    constructor() public {
        a = 0;
    }

    function outward(uint256 _a) public {
        a = _a;
    }

}
