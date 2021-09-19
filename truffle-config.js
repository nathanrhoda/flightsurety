var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "cereal sample gauge short organ stumble innocent window great swim camera shift";

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