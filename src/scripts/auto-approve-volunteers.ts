/**
 * Auto Approve Volunteers Script
 * 
 * This script connects to the EventDAO contract with the admin private key
 * and automatically approves all pending volunteers.
 */

import { createWalletClient, createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { EventDAOABI } from '../contracts/abis/EventDAO';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration - Replace with your values
let ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '';
const EVENT_DAO_ADDRESS = process.env.EVENT_DAO_ADDRESS as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// 確保私鑰以0x開頭
if (ADMIN_PRIVATE_KEY && !ADMIN_PRIVATE_KEY.startsWith('0x')) {
  ADMIN_PRIVATE_KEY = `0x${ADMIN_PRIVATE_KEY}`;
}

// Validation
if (!ADMIN_PRIVATE_KEY) {
  console.error('Error: ADMIN_PRIVATE_KEY not provided in .env.local file');
  process.exit(1);
}

if (!EVENT_DAO_ADDRESS) {
  console.error('Error: EVENT_DAO_ADDRESS not provided in .env.local file');
  process.exit(1);
}

// Create wallet and public clients
const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
  account,
});

async function main() {
  try {
    console.log('Auto Approve Volunteers Script');
    console.log('---------------------------------------------------------');
    console.log(`Connected to contract: ${EVENT_DAO_ADDRESS}`);
    console.log(`Admin address: ${account.address}`);
    
    // 嘗試獲取ADMIN_ROLE值
    try {
      const adminRole = await publicClient.readContract({
        abi: EventDAOABI,
        address: EVENT_DAO_ADDRESS,
        functionName: 'ADMIN_ROLE',
      });
      console.log(`ADMIN_ROLE value: ${adminRole}`);
      console.log(`Note: We cannot verify admin permissions due to ABI limitations.`);
      console.log(`The script will attempt to approve volunteers directly.`);
    } catch (error) {
      console.error('Error checking ADMIN_ROLE:', error);
    }
    
    // Get volunteer count
    const volunteerCount = await publicClient.readContract({
      abi: EventDAOABI,
      address: EVENT_DAO_ADDRESS,
      functionName: 'getVolunteerCount',
    }) as bigint;
    
    console.log(`Total volunteers: ${volunteerCount}`);
    
    if (Number(volunteerCount) === 0) {
      console.log('No volunteers found.');
      return;
    }
    
    // Get volunteers and check which ones need approval
    const pendingApprovals = [];
    
    for (let i = 0; i < Number(volunteerCount); i++) {
      const volunteer = await publicClient.readContract({
        abi: EventDAOABI,
        address: EVENT_DAO_ADDRESS,
        functionName: 'getVolunteer',
        args: [i],
      }) as any;
      
      // volunteer[3] is the 'approved' status in the returned struct
      const isApproved = volunteer[3];
      
      console.log(`Volunteer #${i}: ${volunteer[1]} (${volunteer[0]}), Approved: ${isApproved ? 'YES' : 'NO'}`);
      
      if (!isApproved) {
        pendingApprovals.push({
          index: i,
          address: volunteer[0],
          name: volunteer[1],
        });
      }
    }
    
    console.log(`Found ${pendingApprovals.length} volunteers pending approval`);
    
    // Approve all pending volunteers
    for (const volunteer of pendingApprovals) {
      console.log(`Approving volunteer ${volunteer.name} (${volunteer.address}) at index ${volunteer.index}...`);
      
      try {
        const hash = await walletClient.writeContract({
          abi: EventDAOABI,
          address: EVENT_DAO_ADDRESS,
          functionName: 'approveVolunteer',
          args: [BigInt(volunteer.index)],
        });
        
        console.log(`Transaction submitted: ${hash}`);
        
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash 
        });
        
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.error(`Failed to approve volunteer at index ${volunteer.index}:`, error);
      }
    }
    
    console.log('Auto-approval process completed.');
    
  } catch (error) {
    console.error('Script execution failed:', error);
  }
}

// Execute the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 