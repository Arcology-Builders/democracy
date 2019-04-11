contract SomeContract {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

}
