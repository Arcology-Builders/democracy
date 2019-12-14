pragma solidity >=0.4.24;
pragma experimental ABIEncoderV2;

contract DifferentSender {

    address public owner;
    address public lastSender;
    address public lastPayer;
    uint256 public lastValue;

    constructor() public {
        owner = msg.sender;
    }

    function send(address _payer) public payable {
        lastSender = msg.sender;
        lastPayer  = _payer;
        lastValue  = msg.value;
    }

}
