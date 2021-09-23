var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "caught town prison rural habit forget item letter antique jungle grab shuffle";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
      gas: 4600000
    }
  },
  mocha: {
    timeout: 100000         
  },
  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};