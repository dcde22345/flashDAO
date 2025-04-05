import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-verify';
import '@nomicfoundation/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import 'dotenv/config';

// 獲取私鑰，如果未設置則使用測試私鑰
const PRIVATE_KEY = process.env.DEPLOY_WALLET_1 || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// @ts-ignore - Ignore etherscan type error
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts-new",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: [PRIVATE_KEY],
      chainId: 84532
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    fuji: {
      url: process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [PRIVATE_KEY],
      chainId: 43113
    },
    flow: {
      url: 'https://mainnet.evm.nodes.onflow.org',
      accounts: [PRIVATE_KEY],
    },
    flowTestnet: {
      url: 'https://testnet.evm.nodes.onflow.org',
      accounts: [PRIVATE_KEY],
    }
  },
  // @ts-ignore - Ignore etherscan type error
  etherscan: {
    apiKey: {
      flow: 'abc',
      flowTestnet: 'abc',
      baseSepolia: process.env.BASESCAN_API_KEY || 'abc',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      fuji: process.env.SNOWTRACE_API_KEY || ''
    },
    customChains: [
      {
        network: 'flow',
        chainId: 747,
        urls: {
          apiURL: 'https://evm.flowscan.io/api',
          browserURL: 'https://evm.flowscan.io/',
        },
      },
      {
        network: 'flowTestnet',
        chainId: 545,
        urls: {
          apiURL: 'https://evm-testnet.flowscan.io/api',
          browserURL: 'https://evm-testnet.flowscan.io/',
        },
      },
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org/'
        }
      }
    ],
  },
  mocha: {
    timeout: 100000
  }
};

export default config;
