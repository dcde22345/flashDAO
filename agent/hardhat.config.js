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
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [process.env.DEPLOY_WALLET_1].filter(Boolean),
      chainId: 84532,
      gasPrice: 'auto'
    },
    baseMainnet: {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.DEPLOY_WALLET_1].filter(Boolean),
      chainId: 8453,
      gasPrice: 'auto'
    }
  },
  etherscan: {
    apiKey: {
      flowTestnet: process.env.ETHERSCAN_API_KEY,
      flowMainnet: process.env.ETHERSCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY,
      baseMainnet: process.env.BASESCAN_API_KEY
    },
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
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
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