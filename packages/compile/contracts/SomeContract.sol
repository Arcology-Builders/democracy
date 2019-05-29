pragma solidity >=0.5.0;
contract SomeContract {

    address public owner;

    constructor() public {
        owner = msg.sender;
    }

}
