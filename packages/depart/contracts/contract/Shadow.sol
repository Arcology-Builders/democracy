pragma solidity >=0.5.0 <0.6.0;

contract Shadow {

    uint256 public a;
    address public sender;
    uint256 public b;

    function () external {
        assembly {
            internalDoTheThing()

            /** calldata map
             * 0x04: 0x24 first param
             * 0x24: 0x44 message sender
             * 0x44: 0x64 second param
             */
            function internalDoTheThing() {
                let an := calldataload(0x04)
                let sendern := calldataload(0x24)
                let bn := calldataload(0x44)
                for { let i := 0x64 } lt(i, 0x160) { i := add(i, 0x01) } {
                  mstore(i, i)
                }
                mstore(0x64, an)
                return(0x64, 0x66)
            }
        }
    } 
}
