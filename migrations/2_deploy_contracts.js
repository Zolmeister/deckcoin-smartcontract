var DEKCoin = artifacts.require("./v0.2/DEKCoin.sol");

module.exports = function(deployer) {
    deployer.deploy(DEKCoin);
};
