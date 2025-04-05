/**
 * Watch and Auto-Approve Volunteers Script
 * 
 * This script continuously monitors the EventDAO contract for new volunteer registrations
 * and automatically approves them using the admin private key.
 */

import { createWalletClient, createPublicClient, http, formatEther, WatchContractEventReturnType, Log } from 'viem';
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

// Track already approved volunteers
const approvedVolunteers = new Set<string>();
let unwatch: WatchContractEventReturnType | null = null;

async function approveVolunteer(volunteerIndex: number, volunteerAddress: string, volunteerName: string) {
  try {
    console.log(`Approving volunteer ${volunteerName} (${volunteerAddress}) at index ${volunteerIndex}...`);
    
    // 不再檢查 ADMIN_ROLE，直接嘗試核准
    // 如果帳戶沒有權限，交易會失敗
    const hash = await walletClient.writeContract({
      abi: EventDAOABI,
      address: EVENT_DAO_ADDRESS,
      functionName: 'approveVolunteer',
      args: [BigInt(volunteerIndex)],
    });
    
    console.log(`Transaction submitted: ${hash}`);
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash 
    });
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Mark as approved
    approvedVolunteers.add(volunteerAddress.toLowerCase());
    
    return true;
  } catch (error) {
    console.error(`Failed to approve volunteer at index ${volunteerIndex}:`, error);
    return false;
  }
}

async function checkAndApproveAllPendingVolunteers() {
  try {
    // Get volunteer count
    const volunteerCount = await publicClient.readContract({
      abi: EventDAOABI,
      address: EVENT_DAO_ADDRESS,
      functionName: 'getVolunteerCount',
    }) as bigint;
    
    console.log(`Current total volunteers: ${volunteerCount}`);
    
    if (Number(volunteerCount) === 0) {
      console.log('No volunteers found.');
      return;
    }
    
    // Get volunteers and check which ones need approval
    for (let i = 0; i < Number(volunteerCount); i++) {
      const volunteer = await publicClient.readContract({
        abi: EventDAOABI,
        address: EVENT_DAO_ADDRESS,
        functionName: 'getVolunteer',
        args: [i],
      }) as any;
      
      const volunteerAddress = volunteer[0].toLowerCase();
      const volunteerName = volunteer[1];
      const isApproved = volunteer[3];
      
      console.log(`Volunteer #${i}: ${volunteerName} (${volunteerAddress}), Approved: ${isApproved ? 'YES' : 'NO'}`);
      
      // Skip if already approved or in our tracking set
      if (isApproved || approvedVolunteers.has(volunteerAddress)) {
        console.log(`Volunteer #${i} is already approved or in tracking set, skipping.`);
        continue;
      }
      
      // Found a volunteer that needs approval
      console.log(`Volunteer #${i} needs approval, attempting to approve...`);
      await approveVolunteer(i, volunteerAddress, volunteerName);
    }
  } catch (error) {
    console.error('Error checking for pending volunteers:', error);
  }
}

async function setupEventListener() {
  console.log('Setting up event listener for new volunteer registrations...');
  
  // Watch for VolunteerRegistered events
  unwatch = publicClient.watchContractEvent({
    address: EVENT_DAO_ADDRESS,
    abi: EventDAOABI,
    eventName: 'VolunteerRegistered',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          // Cast the log to any to access args
          const logData = log as any;
          const volunteerAddress = logData.args.volunteer as string;
          const volunteerName = logData.args.name as string;
          
          console.log(`New volunteer registered: ${volunteerName} (${volunteerAddress})`);
          
          // Get the volunteer index
          const volunteerCount = await publicClient.readContract({
            abi: EventDAOABI,
            address: EVENT_DAO_ADDRESS,
            functionName: 'getVolunteerCount',
          }) as bigint;
          
          console.log(`After registration, volunteer count: ${volunteerCount}`);
          
          // Check all volunteers to find the index of the new one
          for (let i = 0; i < Number(volunteerCount); i++) {
            const volunteer = await publicClient.readContract({
              abi: EventDAOABI,
              address: EVENT_DAO_ADDRESS,
              functionName: 'getVolunteer',
              args: [i],
            }) as any;
            
            if (volunteer[0].toLowerCase() === volunteerAddress.toLowerCase()) {
              console.log(`Found new volunteer at index ${i}`);
              
              // Check if already approved
              if (!volunteer[3] && !approvedVolunteers.has(volunteerAddress.toLowerCase())) {
                // Approve this volunteer
                await approveVolunteer(i, volunteerAddress, volunteerName);
              } else {
                console.log(`Volunteer at index ${i} is already approved, skipping.`);
              }
              break;
            }
          }
        } catch (error) {
          console.error('Error processing volunteer registration event:', error);
        }
      }
    },
    pollingInterval: 5000, // Poll every 5 seconds
  });
}

async function main() {
  try {
    console.log('Watch and Auto-Approve Volunteers Script');
    console.log('---------------------------------------------------------');
    console.log(`Connected to contract: ${EVENT_DAO_ADDRESS}`);
    console.log(`Admin address: ${account.address}`);
    
    // 檢查合約界面，但不使用 hasRole 函數
    try {
      // 嘗試獲取ADMIN_ROLE值
      const adminRole = await publicClient.readContract({
        abi: EventDAOABI,
        address: EVENT_DAO_ADDRESS,
        functionName: 'ADMIN_ROLE',
      });
      console.log(`ADMIN_ROLE value: ${adminRole}`);
      
      // 不再嘗試檢查管理員權限，直接假設提供的私鑰有權限
      console.log(`Note: We cannot verify admin permissions due to ABI limitations.`);
      console.log(`The script will attempt to approve volunteers directly.`);
      console.log(`If your account doesn't have ADMIN_ROLE, transactions will fail.`);
    } catch (error) {
      console.error('Error checking contract interface:', error);
    }
    
    // First, check and approve all existing pending volunteers
    await checkAndApproveAllPendingVolunteers();
    
    // Then set up the event listener for new registrations
    await setupEventListener();
    
    console.log('Watching for new volunteer registrations...');
    console.log('Press Ctrl+C to stop the script');
    
    // Keep the script running
    process.on('SIGINT', () => {
      console.log('Stopping the watch script...');
      if (unwatch) {
        unwatch();
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Script execution failed:', error);
    if (unwatch) {
      unwatch();
    }
    process.exit(1);
  }
}

// Execute the script
main().catch(error => {
  console.error('Unhandled error:', error);
  if (unwatch) {
    unwatch();
  }
  process.exit(1);
}); 