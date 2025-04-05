require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {},
    flowTestnet: {
      url: process.env.FLOW_RPC_URL || "https://testnet.evm.nodes.onflow.org",
      accounts: [process.env.DEPLOY_WALLET_1].filter(Boolean),
      chainId: 12553,
      gasPrice: 2000000000, // 2 gwei
    },
    flowMainnet: {
      url: "https://evm.nodes.onflow.org",
      accounts: [process.env.DEPLOY_WALLET_1].filter(Boolean),
      chainId: 12532,
      gasPrice: 2000000000, // 2 gwei
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "flowTestnet",
        chainId: 12553,
        urls: {
          apiURL: "https://testnet.evm.nodes.onflow.org/api",
          browserURL: "https://testnet.flowdiver.io"
        }
      },
      {
        network: "flowMainnet",
        chainId: 12532,
        urls: {
          apiURL: "https://evm.nodes.onflow.org/api",
          browserURL: "https://flowdiver.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}; 