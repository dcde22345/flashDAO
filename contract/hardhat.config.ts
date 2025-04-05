import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import '@types/node';
import '@nomicfoundation/hardhat-verify';

import '@openzeppelin/hardhat-upgrades';
import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: [process.env.DEPLOY_WALLET_1 as string],
      chainId: 84532
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
      accounts: [process.env.DEPLOY_WALLET_1 as string],
      chainId: 11155111
    },
    fuji: {
      url: process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [process.env.DEPLOY_WALLET_1 as string],
      chainId: 43113
    },
    flow: {
      url: 'https://mainnet.evm.nodes.onflow.org',
      accounts: [process.env.DEPLOY_WALLET_1 as string],
    },
    flowTestnet: {
      url: 'https://testnet.evm.nodes.onflow.org',
      accounts: [process.env.DEPLOY_WALLET_1 as string],
    }
  },
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
