pragma solidity ^0.4.15;

import './DeckCoin.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol';

contract DeckCoinCrowdsale is RefundableCrowdsale {
  using SafeMath for uint256;

  uint256 public constant startTime = 1508824800; // Oct. 24th 1AM CST
  uint256 public constant endTime = 1511506800; // Nov. 24th 1AM CST
  uint256 public constant fortyEndTime = 1509516000; // Nov. 1st 1AM CST
  uint256 public constant twentyEndTime = 1510124400; // Nov. 8th 1AM CST
  uint256 public constant tenEndTime = 1510729200; // Nov. 15th 1AM CST
  uint256 public constant tokenGoal = 8000000 * 10 ** 18;
  uint256 public constant tokenCap = 70000000 * 10 ** 18;
  uint256 public constant rate = 28000;
  address public constant wallet = 0x67cE4BFf7333C091EADc1d90425590d931A3E972;
  uint256 public tokensSold;

  function DeckCoinCrowdsale()
    FinalizableCrowdsale()
    RefundableCrowdsale(1)
    Crowdsale(startTime, endTime, rate, wallet) public {}

  function bulkMint(uint[] data) onlyOwner public {
    DeckCoin(token).bulkMint(data);
  }

  function finishMinting() onlyOwner public  {
    token.finishMinting();
  }

  function weiToTokens(uint256 weiAmount) public constant returns (uint256){
    uint256 tokens;

    // Note: assumes rate is 28000
    if (now < fortyEndTime) {
      tokens = weiAmount.mul(rate.add(11200));
    } else if (now < twentyEndTime) {
      tokens = weiAmount.mul(rate.add(5600));
    } else if (now < tenEndTime) {
      tokens = weiAmount.mul(rate.add(2800));
    } else {
      tokens = weiAmount.mul(rate);
    }

    return tokens;
  }

  // @Override
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;

    //
    // START CHANGES
    //

    uint256 tokens = weiToTokens(weiAmount);
    tokensSold = tokensSold.add(tokens);

    //
    // END CHANGES
    //

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  // @Override
  function goalReached() public constant returns (bool) {
    return tokensSold >= tokenGoal;
  }

  // @Override
  function hasEnded() public constant returns (bool) {
    bool capReached = tokensSold >= tokenCap;
    return super.hasEnded() || capReached;
  }

  // @Override
  function validPurchase() internal constant returns (bool) {
    bool withinCap = tokensSold.add(weiToTokens(msg.value)) <= tokenCap;
    return super.validPurchase() && withinCap;
  }

  // @Override
  function createTokenContract() internal returns (MintableToken) {
    return new DeckCoin();
  }

}
