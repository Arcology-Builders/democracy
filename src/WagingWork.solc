pragma solidity ^0.4.19;

/*
 * This contract allows a honcho, who pays for work, to submit an ETH/USD
 * exchange rate for paying a worker, and a budgeted amount for the previous week.
 * The worker then submits hours worked with the rate they will accept.
 */
contract WagingWork {

    address public honcho; // contract creator and payer, to set max hours
    uint32 public hourlyRateInWei; // so we don't have to divide.
    address public lastWorker; // the last worker to submit hours
    uint8 public lastHoursWorked; // the number of hours worked for last worker
    uint payoutETH;

    uint8 public maxHoursWorked;

    function WagingWork() public {
        honcho = msg.sender;
    }

    function setMaxHours(uint8 _maxHoursWorked) public {
        require(msg.sender == honcho); // only the honcho can increase max hours
        require(_maxHoursWorked > 0);
        maxHoursWorked = _maxHoursWorked;
    }

    function submitTimesheet(address _worker, uint8 _hoursWorked, uint32 _hourlyRateInWei) public {
        require(_hoursWorked < maxHoursWorked);
        lastWorker = _worker;
        lastHoursWorked = _hoursWorked;
        hourlyRateInWei = _hourlyRateInWei;
        payoutETH = 0;
    }

    function payIn(uint32 _hourlyRateInWei) payable public {
        require(hourlyRateInWei == _hourlyRateInWei); // honcho's rate must match worker's rate
        require(lastWorker != 0);
        require(lastHoursWorked > 0);
        require(payoutETH == 0);
        payoutETH = lastHoursWorked * hourlyRateInWei;
        if (!lastWorker.send(payoutETH)) {
            payoutETH = 0; // if payment fails, reset to zero
        }
    }

}
