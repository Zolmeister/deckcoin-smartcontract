var DeckCoin = artifacts.require("./DeckCoin.sol");
var DeckCoinCrowdsale = artifacts.require("./DeckCoinCrowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(DeckCoin)
  deployer.deploy(DeckCoinCrowdsale)
};
