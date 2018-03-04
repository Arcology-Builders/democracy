all:
	solc src/ZcashEscrow.solc src/CrowdHacker.solc
	solc src/LeanFund.solc src/SafeMath.solc --bin --abi -o outputs --overwrite
	solc src/LeanFund.solc src/SafeMath.solc --bin --abi -o outputs --overwrite
	solc src/TimelyResource.sol --bin --abi -o outputs --overwrite
