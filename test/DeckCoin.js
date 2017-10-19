var _ = require('lodash')
var bigInt = require('big-integer')

var util = require('./util')

var DeckCoin = artifacts.require("./DeckCoin.sol");

var b = function (a, b) {
  if (a !== b) throw new Error(`expected ${a} to be ${b}`)
}

contract('DeckCoin', function(accounts) {
  it('basic public ERC20 optional constants', async function() {
    let instance = await DeckCoin.new()

    b((await instance.name()).toString(), 'Deck Coin')
    b((await instance.symbol()).toString(), 'DEK')
    b((await instance.decimals()).toNumber(), 18)
  })

  it('bulkMint minting', async function () {
    let instance = await DeckCoin.new()

    let a1 = accounts[0]
    let a2 = accounts[1]
    let a3 = accounts[2]

    b((await instance.balanceOf(a1)).toNumber(), 0)
    b((await instance.balanceOf(a2)).toNumber(), 0)
    b((await instance.balanceOf(a3)).toNumber(), 0)
    b((await instance.totalSupply()).toNumber(), 0)

    let a1Amount = 100
    let a1Data = util.pack(a1, a1Amount)
    let [a1U, a1A] = util.unpack(a1Data.toString())

    b(a1.toString(), '0x' + _.padStart(a1U.toString(16), 40, '0'))
    b(a1Amount.toString(), a1A.toString())

    let events = await instance.bulkMint([
      util.pack(a1, 123),
      util.pack(a2, 3210),
      util.pack(a3, util.dekToDik(111))
    ])
    let total = util.dekToDik(111).add(123).add(3210).toString()

    b((await instance.balanceOf(a1)).toNumber(), 123)
    b((await instance.balanceOf(a2)).toNumber(), 3210)
    b((await instance.balanceOf(a3)).toFixed(), util.dekToDik(111).toString())

    b((await instance.totalSupply()).toString(), total)

    b(events.logs.length, 1)
    b(events.logs[0].event, 'Mint')
    b(events.logs[0].args.amount.toString(), total)

    await instance.bulkMint([
      util.pack(a2, 1)
    ])
    b((await instance.balanceOf(a2)).toNumber(), 3211)
  })

  it('stops minting after minting flag set', async function () {
    let instance = await DeckCoin.new()
    let a1 = accounts[0]

    b((await instance.balanceOf(a1)).toNumber(), 0)
    b((await instance.totalSupply()).toNumber(), 0)

    let events = await instance.bulkMint([
      util.pack(a1, 123),
    ])

    b((await instance.balanceOf(a1)).toNumber(), 123)
    b((await instance.totalSupply()).toNumber(), 123)

    await instance.finishMinting()

    try {
      await instance.bulkMint([
        util.pack(a1, 1)
      ])
    } catch (err) {
      b(err.message, 'VM Exception while processing transaction: invalid opcode')
      b((await instance.balanceOf(a1)).toNumber(), 123)
      b((await instance.totalSupply()).toNumber(), 123)
      return
    }
    throw new Error('Expected error')
  })

  it('bulkMint auth', async function () {
    let instance = await DeckCoin.new()
    try {
      await instance.bulkMint([
        util.pack(accounts[0], 1)
      ], {from: accounts[1]})
    } catch (err) {
      b(err.message, 'VM Exception while processing transaction: invalid opcode')
      b((await instance.balanceOf(accounts[0])).toNumber(), 0)
      b((await instance.totalSupply()).toNumber(), 0)

      await instance.bulkMint([
        util.pack(accounts[0], 1)
      ], {from: accounts[0]})

      b((await instance.balanceOf(accounts[0])).toNumber(), 1)
      b((await instance.totalSupply()).toNumber(), 1)

      return
    }
    throw new Error('Expected failure')
  })

  it('bulkMint high values caused by decimals', async function () {
    let instance = await DeckCoin.new()
    let large = bigInt(10).pow(18).multiply(5000000).add(1)

    await instance.bulkMint([
      util.pack(accounts[3], large)
    ])

    b((await instance.balanceOf(accounts[3])).toFixed(), large.toString())
    b((await instance.totalSupply()).toFixed(), large.toString())
  })

  it('bulkMint high addresses', async function () {
    let instance = await DeckCoin.new()
    let highAddress = '0xffffffffffffffffffffffffffffffffffffffff'

    await instance.bulkMint([
      util.pack(highAddress, 5)
    ])

    b((await instance.balanceOf(highAddress)).toNumber(), 5)
    b((await instance.totalSupply()).toNumber(), 5)
  })

  it('bulkMint costs minimum gas', async function () {
    let instance = await DeckCoin.new()
    let transaction = await instance.bulkMint(_.map(_.range(500), function (i) {
      return util.pack(accounts[0], util.dekToDik(1111 + i))
    }))
    b(transaction.receipt.gasUsed, 3857060)
  })
});
