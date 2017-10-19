const bigInt = require('big-integer')

const util = require('./util')

const DeckCoin = artifacts.require("./DeckCoin.sol");
const DeckCoinCrowdsale = artifacts.require("./DeckCoinCrowdsale.sol");

const b = function (a, b) {
  if (a !== b) throw new Error(`expected ${a} to be ${b}`)
}

const startTime = Date.UTC(2017, 9, 24, 6); // Oct. 24th 1AM CST
const endTime = Date.UTC(2017, 10, 24, 7); // Nov. 24th 1AM CST
const fortyEndTime = Date.UTC(2017, 10, 1, 6); // Nov. 1st 1AM CST
const twentyEndTime = Date.UTC(2017, 10, 8, 7); // Nov. 8th 1AM CST
const tenEndTime = Date.UTC(2017, 10, 15, 7); // Nov. 15th 1AM CST

const ONE_MIN_MS = 1000 * 60

const setTime = async function (date, cb) {
  let now = web3.eth.getBlock(web3.eth.blockNumber).timestamp * 1000
  let delta = new Date(date) - now
  let snapshotId = web3.currentProvider.send({jsonrpc: "2.0", method: "evm_snapshot", params: [], id: 0}).result
  web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [Math.floor(delta / 1000)], id: 0})
  web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
  try {
    await cb()
  } catch (err) {
    throw err
  } finally {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_revert", params: [snapshotId], id: 0})
  }
}

const testBuyAtRate = async function (account, sale, token, rate) {
  let initialTokensSold = (await sale.tokensSold()).toFixed()
  b((await token.balanceOf(account)).toNumber(), 0)
  await sale.buyTokens(account, {from: account, value: web3.toWei(1, 'ether')})
  b((await token.balanceOf(account)).toFixed(), rate.toString())
  b((await sale.tokensSold()).toFixed(), rate.add(initialTokensSold).toString())
  await sale.sendTransaction({from: account, value: web3.toWei(2, 'ether')})
  b((await token.balanceOf(account)).toFixed(), rate.multiply(3).toString())
  b((await sale.tokensSold()).toFixed(), rate.multiply(3).add(initialTokensSold).toString())
}

contract('DeckCoinCrowdsale', function(accounts) {
  it('basic constants', async function () {
    let instance = await DeckCoinCrowdsale.new()

    b((await instance.startTime()).toString(), startTime / 1000 + '');
    b((await instance.endTime()).toString(), endTime / 1000 + '');
    b((await instance.fortyEndTime()).toString(), fortyEndTime / 1000 + '');
    b((await instance.twentyEndTime()).toString(), twentyEndTime / 1000 + '');
    b((await instance.tenEndTime()).toString(), tenEndTime / 1000 + '');
    b((await instance.tokenGoal()).toFixed(), util.dekToDik(8000000).toString());
    b((await instance.tokenCap()).toFixed(), util.dekToDik(70000000).toString());
    b((await instance.rate()).toString(), '28000');
    b((await instance.wallet()).toString(), '0x67cE4BFf7333C091EADc1d90425590d931A3E972'.toLowerCase());
    b((await instance.tokensSold()).toNumber(), 0);
  })

  it('bulkMint forwards call to coin', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())

    b((await token.balanceOf(accounts[0])).toNumber(), 0)
    b((await token.balanceOf(accounts[1])).toNumber(), 0)
    b((await token.totalSupply()).toNumber(), 0)

    await instance.bulkMint([
      util.pack(accounts[0], 123),
      util.pack(accounts[1], 3210),
    ])

    b((await token.balanceOf(accounts[0])).toNumber(), 123)
    b((await token.balanceOf(accounts[1])).toNumber(), 3210)

    b((await token.totalSupply()).toNumber(), 123 + 3210)
  })

  it('bulkMint auth', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())

    try {
      await instance.bulkMint([
        util.pack(accounts[0], 1)
      ], {from: accounts[1]})
    } catch (err) {
      b(err.message, 'VM Exception while processing transaction: invalid opcode')
      b((await token.balanceOf(accounts[0])).toNumber(), 0)
      b((await token.totalSupply()).toNumber(), 0)

      await instance.bulkMint([
        util.pack(accounts[0], 1)
      ], {from: accounts[0]})

      b((await token.balanceOf(accounts[0])).toNumber(), 1)
      b((await token.totalSupply()).toNumber(), 1)

      return
    }
    throw new Error('Expected failure')
  })

  it('finishMinting forwards call to coin', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())

    await instance.bulkMint([
      util.pack(accounts[1], 111)
    ])

    await instance.finishMinting()

    try {
      await instance.bulkMint([
        util.pack(accounts[1], 222)
      ])
    } catch (err) {
      b(err.message, 'VM Exception while processing transaction: invalid opcode')
      b((await token.balanceOf(accounts[1])).toNumber(), 111)
      b((await token.totalSupply()).toNumber(), 111)
      return
    }
    throw new Error('Expected failure')
  })

  it('finishMinting auth', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())

    try {
      await instance.finishMinting({from: accounts[1]})
    } catch (err) {
      b(err.message, 'VM Exception while processing transaction: invalid opcode')

      b((await token.balanceOf(accounts[1])).toNumber(), 0)
      b((await token.totalSupply()).toNumber(), 0)

      await instance.bulkMint([
        util.pack(accounts[1], 222)
      ])

      b((await token.balanceOf(accounts[1])).toNumber(), 222)
      b((await token.totalSupply()).toNumber(), 222)

      return
    }
    throw new Error('Expected failure')
  })

  it('buyToken/fallback < start', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    await setTime(startTime - ONE_MIN_MS, async function () {
      try {
        await instance.buyTokens(accounts[1], {from: accounts[1], value: 1})
      } catch (err) {
        b(err.message, 'VM Exception while processing transaction: invalid opcode')
        b((await token.balanceOf(accounts[1])).toNumber(), 0)

        try {
          await instance.sendTransaction({from: accounts[1], value: 1})
        } catch (err) {
          b(err.message, 'VM Exception while processing transaction: invalid opcode')
          b((await token.balanceOf(accounts[1])).toNumber(), 0)
          return
        }
        throw new Error('Expected failure')
      }
      throw new Error('Expected failure')
    })
  })

  it('buyToken/fallback < fortyEnd', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let rate = util.dekToDik(28000 * 1.4)

    await setTime(startTime + ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[1], instance, token, rate)
    })

    await setTime(fortyEndTime - ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[2], instance, token, rate)
    })
  })

  it('buyToken/fallback < twentyEnd', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let rate = util.dekToDik(28000 * 1.2)

    await setTime(fortyEndTime + ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[1], instance, token, rate)
    })

    await setTime(twentyEndTime - ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[2], instance, token, rate)
    })
  })

  it('buyToken/fallback < tenEnd', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let rate = util.dekToDik(Math.floor(28000 * 1.1))

    await setTime(twentyEndTime + ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[1], instance, token, rate)
    })

    await setTime(tenEndTime - ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[2], instance, token, rate)
    })
  })

  it('buyToken/fallback < end', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let rate = util.dekToDik(28000)

    await setTime(tenEndTime + ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[1], instance, token, rate)
    })

    await setTime(endTime - ONE_MIN_MS, async function () {
      await testBuyAtRate(accounts[2], instance, token, rate)
    })
  })

  it('buyToken/fallback > end', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let rate = util.dekToDik(28000)

    await setTime(endTime + ONE_MIN_MS, async function () {
      try {
        await testBuyAtRate(accounts[1], instance, token, rate)
      } catch (err) {
        b(err.message, 'VM Exception while processing transaction: invalid opcode')
        b((await token.balanceOf(accounts[1])).toNumber(), 0)
        return
      }
      throw new Error('Expected failure')
    })
  })

  it('refunds if less than goal', async function () {
    let instance = await DeckCoinCrowdsale.new()

    function ether(wei) {
      return Math.floor(web3.fromWei(wei))
    }

    await setTime(startTime + ONE_MIN_MS, async function () {
      let initialBalance = web3.eth.getBalance(accounts[1])
      await instance.buyTokens(accounts[1], {from: accounts[1], value: web3.toWei(5, 'ether')})
      b(ether(web3.eth.getBalance(accounts[1])), ether(initialBalance) - 5)
      await setTime(endTime + ONE_MIN_MS, async function () {
        await instance.finalize()
        await instance.claimRefund({from: accounts[1]})
        b(ether(web3.eth.getBalance(accounts[1])), ether(initialBalance))
      })
    })
  })

  it('forwards to wallet', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let wallet = await instance.wallet()

    let goalEth = Math.ceil(8000000 / 28000)
    await setTime(endTime - ONE_MIN_MS, async function () {
      let initialBalance = web3.eth.getBalance(wallet)
      b(initialBalance.toNumber(), 0)
      b(await instance.goalReached(), false)
      await instance.buyTokens(accounts[0], {from: accounts[0], value: web3.toWei(goalEth, 'ether')})
      b(await instance.goalReached(), true)
      await setTime(endTime + ONE_MIN_MS, async function () {
        await instance.finalize()
        b(web3.eth.getBalance(wallet).toFixed(), web3.toWei(goalEth, 'ether'))
      })
    })
  })

  it('respects cap', async function () {
    let instance = await DeckCoinCrowdsale.new()
    let token = await DeckCoin.at(await instance.token())
    let wallet = await instance.wallet()

    let maxEth = util.dekToDik(70000000).divide(28000)

    await setTime(endTime - ONE_MIN_MS, async function () {
      let initialBalance = web3.eth.getBalance(wallet)
      b(initialBalance.toNumber(), 0)
      b(await instance.goalReached(), false)
      await instance.buyTokens(accounts[0], {from: accounts[0], value: maxEth})
      try {
        await instance.buyTokens(accounts[0], {from: accounts[0], value: web3.toWei(1, 'ether')})
      } catch (err) {
        b(await instance.goalReached(), true)
        b(err.message, 'VM Exception while processing transaction: invalid opcode')
        b(util.dikToDek((await token.totalSupply()).toFixed()).toString(), '70000000')
        await instance.finalize()
        b(web3.eth.getBalance(wallet).toFixed(), maxEth.toString())
        return
      }
      throw new Error('Expected failure')
    })
  })

});
