pragma solidity >=0.4.24 <0.6.0;

library TestInterface {
    function internalFunc( uint256 ) external pure returns (bool) {}
}

contract TestImpl {

    function() external payable {
        assembly {
            internalFunc()
            mstore(0x00, 404)
            revert(0x00, 0x20)

            function internalFunc() {
                let n := calldataload(0x04)
                // Always returns true
                mstore(0x00, 0x01)
                return(0x00, 0x20)
            }
        }
    }
 
}
