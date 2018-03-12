ZEPPELIN_BASE="./node_modules/zeppelin-solidity/contracts/"
SOLC_FLAGS="--bin --abi -o outputs --overwrite"

all:
	solc src/ZcashEscrow.solc src/CrowdHacker.solc
	solc src/PinataEscrow.solc src/PinataEscrow.solc
	solc src/LeanFund.solc src/SafeMath.solc --bin --abi -o outputs --overwrite
	solc src/LeanFund.solc src/SafeMath.solc --bin --abi -o outputs --overwrite
	solc src/TimelyResource.sol --bin --abi -o outputs --overwrite
	solc ${ZEPPELIN_BASE}/*.sol --bin --abi -o outputs --overwrite
