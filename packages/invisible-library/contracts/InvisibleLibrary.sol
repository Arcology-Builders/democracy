pragma solidity >=0.4.22 <0.6.0;

contract InvisibleLibrary {
    
    enum Status { UNINIT, AVAILABLE, CLAIMED, TAKEN }
    
    struct Artifact {
        uint256 id;
        Status status;
        string photoURL;
        string shortDesc;
        string longDescURL;
        address claimer;
        uint256 claimBlockNumber;
    }
    
    address public owner;
    mapping(uint256 => Artifact) public artifacts;
    uint256 public nextId;
    
    constructor() public {
        owner = msg.sender; // owner is the deployer of this contract
        nextId = 0;
    }
    
    function postArtifact(string memory _photoURL, string memory _shortDesc, string memory _longDescURL) public {
        require(artifacts[nextId].status == Status.UNINIT); // prevent overflow error of nextId
        Artifact storage art = artifacts[nextId];
        art.status      = Status.AVAILABLE;
        art.photoURL    = _photoURL;
        art.shortDesc   = _shortDesc;
        art.longDescURL = _longDescURL;
        nextId = nextId + 1;
    }
    
    function claimArtifact(uint256 _id, uint256 _claimBlockNumber) public {
        require(artifacts[_id].status == Status.AVAILABLE);
        require(_claimBlockNumber > block.number);
        Artifact storage art = artifacts[_id];
        art.claimer = msg.sender;
        art.status = Status.CLAIMED;
        art.claimBlockNumber = _claimBlockNumber;
    }
    
    function takeArtifact(uint256 _id) public {
        require(artifacts[_id].status == Status.CLAIMED);
        Artifact storage art = artifacts[_id];
        art.claimer = msg.sender;
        art.claimBlockNumber = now;
        art.status = Status.TAKEN;
    }
}
