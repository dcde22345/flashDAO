// Script to create a Circle payment link
// Usage: node scripts/createPaymentLink.js <disasterId> <userAddress> <amount>
require('dotenv').config();
const axios = require('axios');

// Circle API configuration
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_MERCHANT_ID = process.env.CIRCLE_MERCHANT_ENTITY_ID;
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://yourdomain.com/payment/success';
const CANCEL_URL = process.env.CANCEL_URL || 'https://yourdomain.com/payment/cancel';

if (!CIRCLE_API_KEY || !CIRCLE_MERCHANT_ID) {
  console.error('Error: CIRCLE_API_KEY and CIRCLE_MERCHANT_ENTITY_ID must be set in .env file');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node scripts/createPaymentLink.js <disasterId> <userAddress> <amount>');
  process.exit(1);
}

const disasterId = args[0];
const userAddress = args[1];
const amount = parseFloat(args[2]);

// Validate inputs
if (isNaN(amount) || amount <= 0) {
  console.error('Error: Amount must be a positive number');
  process.exit(1);
}

// Format amount for Circle API (in cents)
const amountInCents = Math.floor(amount * 100);

/**
 * Create a Circle payment link
 */
async function createPaymentLink() {
  try {
    console.log(`Creating payment link for disaster ID ${disasterId}, user ${userAddress}, amount $${amount}...`);
    
    // Configure API request
    const url = 'https://api.circle.com/v1/checkouts';
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CIRCLE_API_KEY}`
    };
    
    // Prepare checkout data
    const data = {
      merchantEntityId: CIRCLE_MERCHANT_ID,
      idempotencyKey: `donation-${disasterId}-${userAddress}-${Date.now()}`,
      amount: {
        amount: amountInCents.toString(),
        currency: 'USD'
      },
      metadata: {
        disasterId: disasterId,
        userAddress: userAddress,
        donationType: 'flashDAO'
      },
      settlementCurrency: 'USD',
      redirectUrl: REDIRECT_URL,
      cancelUrl: CANCEL_URL,
      description: `Donation for FlashDAO disaster relief - ID: ${disasterId}`,
      paymentMethods: [
        { type: 'card' },
        { type: 'ach' },
        { type: 'sepa' },
        { type: 'wire' },
        { type: 'crypto' }
      ]
    };
    
    // Send API request to Circle
    const response = await axios.post(url, data, { headers });
    
    if (response.data && response.data.data && response.data.data.checkoutUrl) {
      console.log('Payment link created successfully!');
      console.log(`Checkout URL: ${response.data.data.checkoutUrl}`);
      console.log(`Checkout ID: ${response.data.data.id}`);
      return response.data.data.checkoutUrl;
    } else {
      console.error('Unexpected response format:', response.data);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('API error:', error.response.data);
    } else {
      console.error('Error creating payment link:', error.message);
    }
    return null;
  }
}

// Execute the function
createPaymentLink()
  .then(url => {
    if (!url) {
      process.exit(1);
    }
    console.log('\nShare this URL with the donor to complete the donation process.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 