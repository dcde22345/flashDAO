# FlashDAO

FlashDAO is an LLM-powered smart DAO creation system for disaster response and humanitarian aid. The system monitors real-world disaster events, automatically generates smart contracts, and facilitates donations and aid distribution.

## Features

- Generate smart contracts tailored to specific disaster events using LLM
- Support for multiple disaster types (earthquake, flood, fire, etc.)
- Receive donations via Circle payment gateway
- Volunteer registration and verification mechanism
- On-chain voting-based fund allocation

## System Architecture

- `contract/`: Contains all Solidity smart contracts and Hardhat configuration
- `scripts/`: Contains all script files, including the LLM contract generator, event listener, etc.
- `logs/`: Runtime logs
- `data/`: Stores processed event data

## Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   cd contract && npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required API keys and configurations

## Run Scripts

All scripts can be run from the root directory using npm commands:

- Start event listener: `npm run start:listener`
- Start payment processor: `npm run start:payment`
- Generate disaster contract: `npm run generate:contract [earthquake|flood|fire]`
- Create payment link: `npm run generate:payment <disasterId> <userAddress> <amount>`
- Monitor earthquake events: `npm run monitor:earthquake`
- Simulate earthquake event: `npm run simulate:earthquake`
- Deploy improved FlashDAO: `npm run deploy`

## Smart Contract Compilation and Testing

- Compile contracts: `npm run compile`
- Run tests: `npm run test`

## API Endpoints

The event listener provides the following API endpoints:

- `POST /api/report-disaster`: Report a new disaster event
- `GET /api/disaster-status/:eventId`: Get the status of a disaster event
- `GET /api/disasters`: Get all ongoing disaster events

The Circle payment processor provides the following endpoint:

- `POST /webhook/circle`: Receive Circle payment notifications

## Environment Variables

Set the following variables in the `.env` file:

- `CLAUDE_API_KEY`: Claude API key
- `CIRCLE_API_KEY`: Circle API key
- `CIRCLE_MERCHANT_ENTITY_ID`: Circle merchant entity ID
- `CIRCLE_WEBHOOK_SECRET`: Circle webhook secret
- `SEPOLIA_RPC_URL`: Sepolia testnet RPC URL
- `DEPLOY_WALLET_1`: Private key for smart contract deployment wallet
- `ETHERSCAN_API_KEY`: Etherscan API key (for contract verification)

## License

MIT
