pragma solidity ^0.4.11;

import './StandardToken.sol';
import './Ownable.sol';


contract DEKCoin is StandardToken, Ownable {
    string public constant name = "Deck Coin";
    string public constant symbol = "DEK";
    uint public constant decimals = 8;

    using SafeMath for uint256;

    // timestamps for first and second Steps
    uint public startFirstStep;
    uint public endFirstStep;
    uint public startSecondStep;
    uint public endSecondStep;

    // address where funds are collected
    address public wallet;

    // how many token units a buyer gets per wei
    uint256 public rate;

    uint256 public minTransactionAmount;

    uint256 public raised = 0;

    modifier inActivePeriod() {
        require((startFirstStep < now && now <= endFirstStep) || (startSecondStep < now && now <= endSecondStep));
        _;
    }

    function DEKCoin(address _wallet, uint _startF, uint _endF, uint _startS, uint _endS) {
        require(_wallet != 0x0);
        require(_startF < _endF);
        require(_startS < _endS);

        // accumulation wallet
        wallet = _wallet;

        //100,000,000 Deck Coins
        totalSupply = 100000000;

        // 1 ETH = 7,500 DEK
        rate = 7500;

        // minimal invest
        minTransactionAmount = 0.1 ether;

        startFirstStep = _startF;
        endFirstStep = _endF;
        startSecondStep = _startS;
        endSecondStep = _endS;

    }

    function setupPeriodForFirstStep(uint _start, uint _end) onlyOwner {
        require(_start < _end);
        startFirstStep = _start;
        endFirstStep = _end;
    }

    function setupPeriodForSecondStep(uint _start, uint _end) onlyOwner {
        require(_start < _end);
        startSecondStep = _start;
        endSecondStep = _end;
    }

    // fallback function can be used to buy tokens
    function () inActivePeriod payable {
        buyTokens(msg.sender);
    }

    // low level token purchase function
    function buyTokens(address _sender) inActivePeriod payable {
        require(_sender != 0x0);
        require(msg.value >= minTransactionAmount);

        uint256 weiAmount = msg.value;

        raised = raised.add(weiAmount);

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);
        // TODO: bonus tokens

        tokenReserve(_sender, tokens);

        forwardFunds();
    }

    // send ether to the fund collection wallet
    // override to create custom fund forwarding mechanisms
    function forwardFunds() internal {
        wallet.transfer(msg.value);
    }

    function getCurrentPeriod() inActivePeriod constant returns (uint){
        if ((startFirstStep < now && now <= endFirstStep)) {
            return 1;
        } else if ((startSecondStep < now && now <= endSecondStep)) {
            return 2;
        } else {
            return 0;
        }
    }

    function tokenReserve(address _to, uint256 _value) internal returns (bool) {
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }
}
