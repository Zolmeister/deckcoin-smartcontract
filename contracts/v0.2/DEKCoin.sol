pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract DEKCoin is MintableToken {

    string public name = "Deck Coin";
    string public symbol = "DEK";
    uint256 public decimals = 8;

}
