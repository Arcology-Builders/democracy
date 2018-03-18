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
        FREE, APPROVED, CONFIRMED, COMPLETED, REFUNDED
    }

    struct Interval {
        // No start number, since this is the key where we access this Interval
        address requester; // support single requester for now
        Status status;
        uint8 duration; // units in this Interval
        uint amount; // amount of token for this interval, constant
        uint paidOut; // to be used in safeWithdrawal pattern
    }

    struct IntervalsList {
        uint head; // block number of head of list
        uint last; // block number of last modified interval
        uint blocksPerUnit; // block count for each interval.
        uint256 bits; // the bitvector
        mapping(uint => Interval) intervals;
    }

      // Checks if the indexed interval is already set in this,
  // and if it isn't sets it and returns true. Otherwise false.
  function set(IntervalsList storage self, uint8 index)
      internal
      returns (bool success)
  {
      uint shifted = uint(1) << index;
      if (shifted == ((~self.bits) & shifted)) {
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
      if (self.bits & shifted == shifted) {
          self.bits = self.bits & ~shifted;
          return true;
      } else {
          return false;
      }
  }

    function listInit(uint256 _start, uint16 _blocksPerUnit) public {
        list.head = _start;
        list.last = _start;
        list.blocksPerUnit = _blocksPerUnit;
        list.bits = 0;
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
    uint constant IN_ADVANCE = 86400;

    ERC20 tokenContract = ERC20(tokenAddr);
    IntervalsList list;

    /* name - display name of this TimelyResource
       unitPriceInToken - the price per unit in token "wei" (10^-18 unit)
       blocksPerUnit - the number of Ethereum blocks in each schedulable unit (limited to 16-bits)

     */
    function TimelyResource() public {
        owner = msg.sender;
    }

    function init(string _name, uint _head, uint16 _blocksPerUnit) public {
        // For convenience, the provider is the one who initializes us
        provider = msg.sender;
        name = _name;
        require(_head > block.number + IN_ADVANCE);
        listInit(_head, _blocksPerUnit);
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
     * This is the only place where we insert a new Interval,
     * so we enforce alignment of startBlock by only accepting
     * an 8-bit offset into the 256-bit schedule bitvector.
     */
    function approveInterval(uint8 _startIndex, address _requester, uint8 _duration, uint _amount) public returns (uint) {
        require(msg.sender == provider);
        uint start = list.head + (list.blocksPerUnit * _startIndex);
        set(list, _startIndex);
        list.intervals[start] = Interval(_requester, Status.APPROVED, _duration, _amount, 0);
        return start;
    }
    /*
     * Only the provider can cancel/reject their requested booking,
     * before it's been confirmed.
     */
    function cancelInterval(uint _start, address _requester) public {
        require(msg.sender == provider || msg.sender == _requester);
        Interval storage ivl = list.intervals[_start];
        // Either we cancel before requester confirms
        // or we refund requester.
        require((ivl.status == Status.APPROVED || ivl.status == Status.CONFIRMED) && ivl.paidOut == 0);
        if (ivl.status == Status.CONFIRMED) {
            ivl.paidOut = ivl.amount;
            _requester.transfer(ivl.amount);
            ivl.status = Status.REFUNDED;
        }
        delete(list.intervals[_start]);
    }

    /*
     * You can only pay before the start time.
     * You can only pay an approved transaction.
     * Anyone can pay (not just the requester) but the appointment only goes to the requester.
     */
    function confirmInterval(uint _start, address _requester) public payable {
        //require(_start > block.number);
        Interval storage ivl = list.intervals[_start];
        //require(ivl.status == Status.APPROVED);
        if (tokenContract.transfer(address(this), ivl.amount)) {
            // We only proceed to this point if we succeed the token transfer
            ivl.status = Status.CONFIRMED;
        }
    }

    function refundInterval(uint8 _startIndex, address _requester) public {
        uint start = list.head + (_startIndex * list.blocksPerUnit);
        require(block.number > start);
        Interval storage ivl = list.intervals[start];
        require(ivl.status == Status.CONFIRMED);
        require(ivl.amount > 0); // we cannot refund a free Interval
        ivl.paidOut = ivl.amount;
        ivl.amount = 0;
        // Todo we still need to handle paying back the token at the contract level

        if (tokenContract.transfer(address(this), ivl.paidOut)) {
            ivl.status = Status.REFUNDED;
        } else {
            ivl.paidOut = 0;
        }
    }

    /*
     * You can only pay before the start time.
     */
    function completeInterval(uint _startIndex, address _requester) public {
        uint start = list.head + (_startIndex * list.blocksPerUnit);
        require(block.number > start);
        require(msg.sender == provider || msg.sender == _requester);
        Interval storage ivl = list.intervals[start];
        require(ivl.requester != 0);
        ivl.status = Status.COMPLETED;
    }

    function safeWithdrawal() public view {
        require(msg.sender == provider);
        // todo: adapt code from LeanFund
    }

    function getBits() public constant returns (uint256 bits) {
        return list.bits;
    }

    function getHead() public constant returns (uint256 head) {
        return list.head;
    }

    function getBlocksPerUnit() public constant returns (uint256 blocksPerUnit) {
        return list.blocksPerUnit;
    }

    function getInterval(
      uint _start
    ) constant public returns (uint8 count, uint pay, Status status) {
        Interval storage ivl = list.intervals[_start];
        require(ivl.status != Status.FREE);
        return (ivl.duration, ivl.amount, ivl.status);
    }


}
