require('@nomicfoundation/hardhat-verify');
require('@nomiclabs/hardhat-ethers');
require('@typechain/hardhat');
const { config: dotenvConfig } = require('dotenv');
dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xc5e8f61d1ab959b397eecc0a37a6517b8e67a0e7cf1f4bce5591f3ed80199122';
const ROLLUX_RPC = 'https://rpc.rollux.com';

module.exports = {
  solidity: {
    version: '0.7.5',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 570,
      forking: {
        url: ROLLUX_RPC,
        enabled: true,
      },
      accounts: [
        {
          privateKey: PRIVATE_KEY,
          balance: '1000000000000000000000',
        },
      ],
    },
    rollux: {
      chainId: 570,
      url: ROLLUX_RPC,
      accounts: [PRIVATE_KEY],
      gasPrice: 'auto',
    },
    coverage: {
      url: 'http://localhost:8555',
      chainId: 1337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 570, // Same as your forked network
      accounts: [PRIVATE_KEY],
      forking: {
        url: ROLLUX_RPC,
        enabled: true,
      },
    }
  },
  etherscan: {
    apiKey: {
      rollux: process.env.BLOCKSCOUT_KEY || 'abc',
    },
    customChains: [
      {
        network: 'rollux',
        chainId: 570,
        urls: {
          apiURL: 'https://explorer.rollux.com/api',
          browserURL: 'https://explorer.rollux.com/',
        },
      },
    ],
  },
  mocha: {
    timeout: 0,
  },
};
