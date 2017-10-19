pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract DeckCoin is MintableToken {
  // ERC20 optionals
  string public constant name = "Deck Coin";
  string public constant symbol = "DEK";
  uint8 public constant decimals = 18;

  uint256 private constant D160 = 0x10000000000000000000000000000000000000000;

  // The 160 LSB is the address of the balance
  // The 96 MSB is the balance of that address.
  // Note: amounts are pre-decimal
  function bulkMint(uint256[] data) onlyOwner canMint public {
    uint256 totalMinted = 0;

    for (uint256 i = 0; i < data.length; i++) {
      address beneficiary = address(data[i] & (D160 - 1));
      uint256 amount = data[i] / D160;

      totalMinted += amount;
      balances[beneficiary] += amount;
    }

    totalSupply = totalSupply.add(totalMinted);
    Mint(0x0, totalMinted);
  }

}
