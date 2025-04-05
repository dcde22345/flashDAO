// Circle payment handler script
// Handles Circle webhooks and triggers contract actions
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { ethers } = require('ethers');
const app = express();

const PORT = process.env.CIRCLE_WEBHOOK_PORT || 3001;
const webhookSecret = process.env.CIRCLE_WEBHOOK_SECRET;
const flashDAOAddress = process.env.IMPROVED_FLASHDAO_ADDRESS;

// Load contract ABI
const ImprovedFlashDAO = require('../contract/artifacts/contracts/ImprovedFlashDAO.sol/ImprovedFlashDAO.json');

// Configure Express
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Verify Circle webhook signature
function verifyCircleSignature(req) {
  if (!webhookSecret) {
    console.error('CIRCLE_WEBHOOK_SECRET not set in .env file');
    return false;
  }

  const signature = req.headers['circle-signature'];
  if (!signature) {
    console.error('No Circle signature found in request headers');
    return false;
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(req.rawBody);
  const calculatedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// Convert Circle amount (in cents) to wei
function convertAmountToWei(amountInCents) {
  // Convert cents to dollars then to wei (assuming 6 decimals for USDC)
  const amountInUSDC = amountInCents / 100;
  return ethers.utils.parseUnits(amountInUSDC.toString(), 6);
}

// Process payment and record pledge in contract
async function processPledge(disasterId, userAddress, amountInWei) {
  try {
    // Connect to provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Load wallet with private key from .env
    const wallet = new ethers.Wallet(process.env.DEPLOY_WALLET_1, provider);
    
    // Connect to contract
    const flashDAOContract = new ethers.Contract(
      flashDAOAddress,
      ImprovedFlashDAO.abi,
      wallet
    );
    
    // Call recordPledge function on the contract
    const tx = await flashDAOContract.recordPledge(disasterId, userAddress, amountInWei);
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Pledge recorded successfully in block ${receipt.blockNumber}`);
    
    return receipt;
  } catch (error) {
    console.error('Error processing pledge:', error);
    throw error;
  }
}

// Circle webhook endpoint
app.post('/webhook/circle', async (req, res) => {
  try {
    // Verify Circle signature
    if (!verifyCircleSignature(req)) {
      console.error('Invalid signature');
      return res.status(401).send('Invalid signature');
    }
    
    const event = req.body;
    console.log('Received Circle webhook:', JSON.stringify(event, null, 2));
    
    // Check if this is a payment notification
    if (event.type === 'payment.created' && event.data.status === 'confirmed') {
      // Extract metadata from the payment
      const metadata = event.data.metadata || {};
      const disasterId = metadata.disasterId;
      const userAddress = metadata.userAddress;
      
      if (!disasterId || !userAddress) {
        console.error('Missing required metadata in payment');
        return res.status(400).send('Missing required metadata');
      }
      
      // Convert amount to wei
      const amountInWei = convertAmountToWei(event.data.amount.amount);
      
      // Record pledge in smart contract
      await processPledge(disasterId, userAddress, amountInWei);
      
      console.log(`Successfully processed payment for disaster ${disasterId} from ${userAddress}`);
    }
    
    // Acknowledge receipt of webhook
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Circle webhook handler running on port ${PORT}`);
  console.log(`FlashDAO contract address: ${flashDAOAddress}`);
}); 