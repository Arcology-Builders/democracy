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

/*
 * A time-based resource (like a hotel room, a barber's time).
 * Resources can be booked as a list of non-overlapping intervals.
 */

library IntervalsUtil {

    enum Status {
        REQUESTED, PAID, COMPLETED, CANCELLED, REFUNDED
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

    function init(IntervalsList storage self, uint256 _start, uint16 _duration, uint _price) public {
        //self.head = _start;
        //self.last = _start;
        //self.price = _price;
        //self.duration = _duration;
        //self.bits = 0;
        //delete(self.intervals);
    }

    /*
     * The reason we accept index numbers into the current IntervalsList
     * is because we don't want to take the chance that the caller will pass in
     * an invalid start number.
     */
    function insertRequestHelper(
        IntervalsList storage self,
        address _requester,
        uint _start) public
    {
        IntervalsUtil.Interval storage ivl = self.intervals[self.head];
        uint current = self.head;
        // this for-loop can be replaced with something more clever involving
        // bitvector arithmetic
        do {
            ivl = self.intervals[current];
            current = ivl.next;
        } while (ivl.hasNext && current < _start);
        // ivl should now point to latest interval that is still before the inserted IntervalsList
        // if ivl is/is not the last, we have the same next
        ivl.next = _start;
        ivl.hasNext = true;
        self.intervals[_start] = Interval(_requester, Status.PAID, 0, ivl.next, ivl.hasNext);
    }

    // Insert the newInterval in this IntervalsList in the correct
    // increasing order of its id's. (Collisions and overlaps are not allowed)
    function insertRequest(
        IntervalsList storage self,
        address _requester,
        uint8 _startIndex) public
    {
        uint start = self.head + (self.duration * _startIndex);
        set(self, _startIndex);
        insertRequestHelper(self, _requester, start);
    }

    function deleteRequestHelper(
        IntervalsList storage self,
        uint _start) public
    {
        IntervalsUtil.Interval storage ivl = self.intervals[self.head];
        uint current = self.head;
        // this for-loop can be replaced with something more clever involving
        // bitvector arithmetic
        do {
            ivl = self.intervals[current];
            current = ivl.next;
        } while (ivl.hasNext && current < _start);
        // ivl should now point to latest interval that is still before the Interval to-be-deleted
        // if ivl is/is not the last, we have the same next
        if (!ivl.hasNext) { return; } // we fell off the end and didn't find it

        IntervalsUtil.Interval storage delIvl = self.intervals[ivl.next];
        ivl.hasNext = delIvl.hasNext;
        // link around it
        if (delIvl.hasNext) {
          ivl.next = delIvl.next;
        }
        delete(self.intervals[ivl.next]);
    }

    function completeRequest(IntervalsList storage self, uint start) public {
        IntervalsUtil.Interval storage ivl = self.intervals[start];
        require(ivl.requester != 0);
        ivl.status = Status.COMPLETED;
    }

    function cancelRequest(IntervalsList storage self, uint start) public {
        IntervalsUtil.Interval storage ivl = self.intervals[start];
        require(ivl.status == Status.REQUESTED);
        ivl.status = Status.CANCELLED;
    }

    function refundRequest(IntervalsList storage self, uint start) public {
        IntervalsUtil.Interval storage ivl = self.intervals[start];
        require(ivl.status == Status.PAID);
        ivl.status = Status.REFUNDED;
        // Todo we still need to handle paying back the token at the contract level
    }

}

contract TimelyResource {

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
    IntervalsUtil.IntervalsList list;
    uint payout; // Totals from completed intervals ready for withdrawal

    /* name - display name of this TimelyResource
       unitPriceInToken - the price per unit in token "wei" (10^-18 unit)
       blocksPerUnit - the number of Ethereum blocks in each schedulable unit (limited to 16-bits)

     */
    function TimelyResource() public {
//        owner = msg.sender;
        //IntervalsUtil.init(list, now + IN_ADVANCE, _blocksPerUnit, _unitPriceInToken);
    }

    function init(string _name, uint16 _blocksPerUnit, uint _unitPriceInToken) public {
        owner = msg.sender;
        name = _name;
        IntervalsUtil.init(list, now + IN_ADVANCE, _blocksPerUnit, _unitPriceInToken);
    }

    function setTokenContract(address _tokenAddr) public {
        tokenAddr = _tokenAddr;
        tokenContract = ERC20(tokenAddr);
    }

    function setProvider(address _provider) public {
        require(msg.sender == owner);
        provider = _provider;
    }

    // /*
    //  * Only the provider can reserve an interval on behalf of the requester.
    //  * This lets the provider handle approvals off-chain.
    //  */
    // function requestBooking(uint8 _startIndex, address _requester) public {
    //     require(msg.sender == provider);
    //     IntervalsUtil.insertRequest(list, _requester, _startIndex);
    // }
    // /*
    //  * The requester can cancel/reject their requested booking,
    //  * before it's been paid.
    //  */
    // function cancelBooking(uint8 _startIndex, address _requester) public {
    //     require(msg.sender == provider || msg.sender == _requester);
    //     IntervalsUtil.cancelRequest(list, _startIndex);
    // }

    // /*
    //  * You can only pay before the start time.
    //  * Consider having the caller pass in the start
    //  */
    // function payInterval(uint8 _startIndex, address _requester) public payable {
    //     uint start = list.head + (_startIndex * list.duration);
    //     require(start > block.number);
    //     tokenContract.transferFrom(_requester, address(this), list.duration);
    //     // We only proceed to this point if we succeed the token transfer
    //     //IntervalsUtil.payRequest(list, _startIndex);
    // }

    // function refundInterval(uint8 _startIndex, address _requester) public {
    //     uint start = list.head + (_startIndex * list.duration);
    //     require(block.number > start);
    //     IntervalsUtil.Interval storage ivl = list.intervals[start];
    //     require(ivl.status == IntervalsUtil.Status.PAID);
    //     require(ivl.paidOut > 0);
    //     uint paidOut = ivl.paidOut;
    //     ivl.paidOut = 0;
    //     tokenContract.transferFrom(address(this), _requester, paidOut);
    // }

    // /*
    //  * You can only pay before the start time.
    //  */
    // function completeInterval(uint _startIndex, address _requester) public {
    //     uint start = list.head + (_startIndex * list.duration);
    //     require(block.number > start);
    //     require(msg.sender == provider || msg.sender == _requester);
    //     //IntervalsUtil.completeRequest(list, _requester, _startIndex);
    //     payout += list.intervals[start].paidOut;
    // }

    // function safeWithdrawal() public view {
    //     require(msg.sender == provider);
    //     require(payout > 0);
    //     // todo: adapt code from LeanFund
    // }

}
