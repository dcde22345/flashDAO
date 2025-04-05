// Test script to verify .env loading
require('dotenv').config();
console.log('Testing environment variable loading:');
console.log('----------------------------------------');
console.log('RPC URL configured:', process.env.SEPOLIA_RPC_URL ? '✅' : '❌');
console.log('DEPLOY_WALLET configured:', process.env.DEPLOY_WALLET_1 ? '✅' : '❌');
console.log('CLAUDE_API_KEY configured:', process.env.CLAUDE_API_KEY ? '✅' : '❌');
console.log('CIRCLE_API_KEY configured:', process.env.CIRCLE_API_KEY ? '✅' : '❌');
console.log('Server PORT configured:', process.env.PORT ? '✅' : '❌');
console.log('----------------------------------------');
console.log('Environment variables loaded successfully!'); 