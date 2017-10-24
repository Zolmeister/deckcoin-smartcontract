# DeckCoin Smart Contract

### Buy DeckCoin at Crowdsale

Crowdsale Address: [`0xcb7f070fDA083E8e5f40559376c360f0709e985C`](https://etherscan.io/address/0xcb7f070fda083e8e5f40559376c360f0709e985c#readContract)  
Make sure to include enough gas (200000 is safe)

Start: Oct. 24th 1AM CST  
End: Nov. 15th 1AM CST

```js
web3.eth.sendTransaction({
  from: eth.accounts[0],
  value: web3.toWei(1, 'ether'),
  to: '0xcb7f070fDA083E8e5f40559376c360f0709e985C',
  gas: 200000,
  gasPrice: web3.toWei(0.1, 'gwei') // http://ethgasstation.info
})
```
### DeckCoin Contract

Coin Address: [`0x15E5c9aA71b8154806038AefC587CfE19B0BC5d6`](https://etherscan.io/address/0x15e5c9aa71b8154806038aefc587cfe19b0bc5d6#readContract)

```js
abi = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]'
coin = eth.contract(JSON.parse(abi)).at('0x15E5c9aA71b8154806038AefC587CfE19B0BC5d6')
coin.totalSupply()
coin.balanceOf(<address>)
```

### Get Crowdsale Information
```js
abi = '[{"constant":true,"inputs":[],"name":"weiRaised","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokensSold","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"weiAmount","type":"uint256"}],"name":"weiToTokens","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"}],"name":"buyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"hasEnded","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"}]'
sale = eth.contract(JSON.parse(abi)).at('0xcb7f070fDA083E8e5f40559376c360f0709e985C')
sale.tokensSold()
```

### Deploy

```bash
yarn run dist
geth attach xxxxxxx
```

```js
loadScript('./dist/compiled.js')
raw = compiled.contracts["contracts/DeckCoinCrowdsale.sol:DeckCoinCrowdsale"]
rawCoin = compiled.contracts["contracts/DeckCoin.sol:DeckCoin"]
Sale = eth.contract(JSON.parse(raw.abi))
Coin = eth.contract(JSON.parse(rawCoin.abi))
deployment = Sale.new({from: eth.accounts[0], data: '0x' + raw.bin, gas: 4000000, gasPrice: web3.toWei(0.005, "GWei")})

sale = Sale.at(deployment.address)
date = Date.UTC(2017, 9, 24, 6) + 1000 * 60
web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [Math.floor((new Date(date) - web3.eth.getBlock(web3.eth.blockNumber).timestamp * 1000) / 1000)], id: 0})
web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
web3.eth.estimateGas({to: sale.address, from: eth.accounts[0], value: web3.toWei(1, 'ether')})
sale.address

eth.getTransactionReceipt(web3.eth.sendTransaction({from: eth.accounts[0], to: sale.address, value: web3.toWei(1, 'ether'), gas: 200000}))
coin = Coin.at(sale.token())
web3.fromWei(coin.balanceOf(eth.accounts[0]), 'ether')

eth.getTransactionReceipt(web3.eth.sendTransaction({from: eth.accounts[0], to: sale.address, value: web3.toWei(1000, 'ether'), gas: 200000}))
date = Date.UTC(2017, 10, 24, 7) + 1000 * 60
web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [Math.floor((new Date(date) - web3.eth.getBlock(web3.eth.blockNumber).timestamp * 1000) / 1000)], id: 0})
web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
sale.finalize({from: eth.accounts[0]})
web3.fromWei(web3.eth.getBalance('0x67cE4BFf7333C091EADc1d90425590d931A3E972'), 'ether')
```
