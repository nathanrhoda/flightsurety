var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "plastic skill wonder pistol blush future alley loop enact camp blame spread";

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