pragma solidity ^0.4.17; 
contract WillAndTestimate{

    enum States {
        Living,
        Waiting,
        Disseminating
    }

    States public state = States.Living;
    address public owner = msg.sender;
    uint public timeOfDeath;
    address[] public beneficiaries;
    uint8[] public benefitPercentages;
    mapping (address => uint) pendingWithdrawals;
    address depositer;
    uint deposit;

    modifier atState(States _state) {
        require(state == _state);
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier isBeneficiary() {
        bool found = false;

        for(uint256 i = 0; i < beneficiaries.length; i++)
            if (beneficiaries[i] == msg.sender)
                found = true;
            
        require(found);
        _;
    }

    modifier costs(uint _amount) {
        require(msg.value >= _amount);
        _;
        if (msg.value > _amount)
            msg.sender.transfer(msg.value - _amount);
    }

    // only allow sending ether to this contract if Living
    function() public payable
        atState(States.Living)
    {
    }

    function SetBeneficiaries(address[] _beneficiaries, uint8[] _benefitPercentages)
        public
        isOwner()
    {
        require(_beneficiaries.length == _benefitPercentages.length);

        uint sum = 0;
        for(uint256 i = 0; i < _beneficiaries.length; i++)
           sum += _benefitPercentages[i]; 
        require(sum == 100);

        beneficiaries = _beneficiaries;
        benefitPercentages = _benefitPercentages;
    }

    event DisseminationBegun();

    function BeginDissemination()
        public
        payable
        costs((this.balance - msg.value) / 100) // this.balance includes the amount sent by current message
        atState(States.Living)
        isBeneficiary()
    {
        timeOfDeath = now;
        depositer = msg.sender;
        deposit = (this.balance - msg.value) / 100;
        state = States.Waiting;
        DisseminationBegun();
    }

    function CancelDissemination()
        public
        isOwner()
        atState(States.Waiting)
    {
        timeOfDeath = 0;
        depositer = 0;
        deposit = 0;
        state = States.Living;
    }

    modifier checkDoneWaiting() {
        // Make the state transition to Disseminating
        if (state == States.Waiting && timeOfDeath + 30 days < now) {
            state = States.Disseminating;

            for(uint256 i = 0; i < beneficiaries.length; i++)
            {
                // divide first to avoid overflow
                pendingWithdrawals[ beneficiaries[i] ] = (this.balance - deposit) / 100 * benefitPercentages[i];
            }

            pendingWithdrawals[depositer] += deposit;
        }

        require(state == States.Disseminating);
        _;
    }
    
    function Collect()
        public
        checkDoneWaiting()
        atState(States.Disseminating)
        isBeneficiary()
    {
        // set withdrawal amount to 0 before sending
        // to stop re-entrancy attack.
        var toSend = pendingWithdrawals[msg.sender];
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(toSend);
    }
}
