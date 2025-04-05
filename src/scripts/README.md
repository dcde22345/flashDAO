# Auto-Approve Volunteers Scripts

This directory contains scripts for automatically approving volunteers in the FlashDAO system.

## Setup

1. Create a `.env` file at the root of the project by copying `.env.example` and filling in the required values:

```
# Base Sepolia RPC URL
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Admin wallet private key (replace with your actual admin private key)
ADMIN_PRIVATE_KEY=0x123... # Replace with your admin private key

# The address of the EventDAO contract to monitor and approve volunteers for
EVENT_DAO_ADDRESS=0x456... # Replace with your EventDAO contract address
```

2. Install the required dependencies:

```bash
npm install
```

## Available Scripts

### One-time Approval

To run a one-time approval of all pending volunteers:

```bash
npm run approve-volunteers
```

This script will:
- Connect to the EventDAO contract with the admin private key
- Find all pending volunteers (not yet approved)
- Approve each volunteer
- Exit when completed

### Continuous Monitoring and Approval

To continuously monitor for new volunteer registrations and automatically approve them:

```bash
npm run watch-and-approve
```

This script will:
- Connect to the EventDAO contract with the admin private key
- Approve all existing pending volunteers
- Watch for new `VolunteerRegistered` events
- Automatically approve new volunteers as they register
- Run continuously until manually stopped (Ctrl+C)

## Troubleshooting

If you encounter issues:

1. Verify that your `.env` file has the correct values:
   - Make sure the admin private key has the correct format and permissions
   - Confirm the EventDAO contract address is correct

2. Check RPC connection:
   - Verify that the RPC URL for Base Sepolia is working
   - Try using a different RPC provider if needed

3. Gas issues:
   - Make sure the admin wallet has enough ETH for transaction fees 