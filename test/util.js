const bigInt = require('big-integer')
const createKeccakHash = require('keccak')
const abi = require('ethereumjs-abi')

function pack(address, amount) {
  return bigInt(amount)
    .shiftLeft(160)
    .plus(bigInt(address.slice(2), 16))
}

function unpack(data) {
  data = bigInt(data)
  let D160 = bigInt('0x10000000000000000000000000000000000000000'.slice(2), 16)
  let address = data.and(D160.minus(1))
  let amount = data.divide(D160)
  return [address, amount]
}

function dekToDik(dek) {
  return bigInt(dek).multiply(bigInt(10).pow(18))
}

function dikToDek(dik) {
  return bigInt(dik).divide(bigInt(10).pow(18))
}

function toChecksumAddress (address) {
  address = address.toLowerCase().replace('0x','');
  var hash = createKeccakHash('keccak256').update(address).digest('hex')
  var ret = '0x'

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

function abiEncodeArgs(types, values) {
  abi.rawEncode(types, values).toString('hex');
}

module.exports = {
  pack: pack,
  unpack: unpack,
  dekToDik: dekToDik,
  dikToDek: dikToDek,
  toChecksumAddress: toChecksumAddress,
  abiEncodeArgs: abiEncodeArgs
}
