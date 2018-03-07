pragma solidity ^0.4.19;

contract ERC20Events {
    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);
}

contract ERC20 is ERC20Events {
    function totalSupply() public view returns (uint);
    function balanceOf(address guy) public view returns (uint);
    function allowance(address src, address guy) public view returns (uint);

    function approve(address guy, uint wad) public returns (bool);
    function transfer(address dst, uint wad) public returns (bool);
    function transferFrom(
        address src, address dst, uint wad
    ) public returns (bool);
}

contract TimelyResource {

    enum Status {
        APPROVED, CONFIRMED, COMPLETED, REFUNDED
    }

    struct Interval {
        // No start number, since this is the key where we access this Interval
        address requester; // support single requester for now
        Status status;
        uint paidOut; // 0 to price
        uint next; // next block number
        bool hasNext; // if we are not the last in the linked list
    }

    struct IntervalsList {
        uint head; // block number of head of list
        uint last; // block number of last modified interval
        uint duration; // block count for each interval.
        uint price; // price per interval, in 10^-18 DAI
        uint256 bits;
        mapping(uint => Interval) intervals;
    }

      // Checks if the indexed interval is already set in this,
  // and if it isn't sets it and returns true. Otherwise false.
  function set(IntervalsList storage self, uint8 index)
      internal
      returns (bool success)
  {
      uint shifted = uint(1) << index;
      if (shifted == ((~self.bits) | shifted)) {
          self.bits = self.bits | shifted;
          return true;
      } else {
          return false;
      }
  }

  function clear(IntervalsList storage self, uint8 index)
      internal
      returns (bool success)
  {
      uint shifted = uint(1) << index;
      if (~ self.bits | shifted == shifted) {
          self.bits = self.bits & ~shifted;
          return true;
      } else {
          return false;
      }
  }

    function listInit(uint256 _start, uint16 _duration, uint _price) public {
        list.head = _start;
        list.last = _start;
        list.price = _price;
        list.duration = _duration;
        list.bits = 0;
    }

    /*
     * The reason we accept index numbers into the current IntervalsList
     * is because we don't want to take the chance that the caller will pass in
     * an invalid start number.
     */
    function insertRequestHelper(
        address _requester,
        uint _start) public
    {
        Interval storage ivl = list.intervals[list.head];
        uint current = list.head;
        // this for-loop can be replaced with something more clever involving
        // bitvector arithmetic
        do {
            ivl = list.intervals[current];
            current = ivl.next;
        } while (ivl.hasNext && current < _start);
        // ivl should now point to latest interval that is still before the inserted IntervalsList
        // if ivl is/is not the last, we have the same next
        ivl.next = _start;
        ivl.hasNext = true;
        list.intervals[_start] = Interval(_requester, Status.CONFIRMED, 0, ivl.next, ivl.hasNext);
    }

    string public name;
    address public owner;
    address public provider;
    // Address of ERC20 token used for payment. DAI by default.
    // Follow mixed-case address literal checksum
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md
    address public tokenAddr = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;
    // must start offerings at least this far in advance
    // 86400 blocks is one day
    uint public constant IN_ADVANCE = 86400;
    ERC20 tokenContract = ERC20(tokenAddr);
    IntervalsList public list;
    uint public payout; // Totals from completed intervals ready for withdrawal

    /* name - display name of this TimelyResource
       unitPriceInToken - the price per unit in token "wei" (10^-18 unit)
       blocksPerUnit - the number of Ethereum blocks in each schedulable unit (limited to 16-bits)

     */
    function TimelyResource() public {
        owner = msg.sender;
    }

    function init(string _name, uint16 _blocksPerUnit, uint _unitPriceInToken) public {
        owner = msg.sender;
        name = _name;
        listInit(now + IN_ADVANCE, _blocksPerUnit, _unitPriceInToken);
    }

    function setTokenContract(address _tokenAddr) public {
        tokenAddr = _tokenAddr;
        tokenContract = ERC20(tokenAddr);
    }

    function setProvider(address _provider) public {
        require(msg.sender == owner);
        provider = _provider;
    }

    /*
     * Only the provider can reserve an interval on behalf of the requester.
     * This lets the provider handle approvals off-chain.
     */
    function requestBooking(uint8 _startIndex, address _requester) public {
        require(msg.sender == provider);
        uint start = list.head + (list.duration * _startIndex);
        set(list, _startIndex);
        insertRequestHelper(_requester, start);
    }
    /*
     * Either requester or provider can cancel/reject their requested booking,
     * before it's been paid.
     */
    function cancelBooking(uint _start, address _requester) public {
        require(msg.sender == provider || msg.sender == _requester);
        Interval storage ivl = list.intervals[_start];
        require(ivl.status == Status.APPROVED);
        delete(list.intervals[_start]);
    }

    /*
     * You can only pay before the start time.
     * You can only pay an approved transaction.
     * Anyone can pay (not just the requester).
     */
    function payInterval(uint _start, address _requester) public payable {
        require(_start > block.number);
        Interval storage ivl = list.intervals[_start];
        require(ivl.status == Status.APPROVED);
        tokenContract.transferFrom(_requester, address(this), list.duration);
        // We only proceed to this point if we succeed the token transfer
        ivl.status = Status.CONFIRMED;
    }

    function refundInterval(uint8 _startIndex, address _requester) public {
        uint start = list.head + (_startIndex * list.duration);
        require(block.number > start);
        Interval storage ivl = list.intervals[start];
        require(ivl.status == Status.CONFIRMED);
        require(ivl.paidOut > 0);
        uint paidOut = ivl.paidOut;
        ivl.paidOut = 0;
        ivl.status = Status.REFUNDED;
        // Todo we still need to handle paying back the token at the contract level

        tokenContract.transferFrom(address(this), _requester, paidOut);
    }

    /*
     * You can only pay before the start time.
     */
    function completeInterval(uint _startIndex, address _requester) public {
        uint start = list.head + (_startIndex * list.duration);
        require(block.number > start);
        require(msg.sender == provider || msg.sender == _requester);
        Interval storage ivl = list.intervals[start];
        require(ivl.requester != 0);
        ivl.status = Status.COMPLETED;
        payout += list.intervals[start].paidOut;
    }

    function safeWithdrawal() public view {
        require(msg.sender == provider);
        require(payout > 0);
        // todo: adapt code from LeanFund
    }

}
