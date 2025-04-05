// Off-chain agent to monitor for earthquakes and trigger FlashDAO creation
require('dotenv').config();
const axios = require('axios');
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Configuration
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson';
const CHECK_INTERVAL = 60 * 1000; // Check every minute
const MIN_MAGNITUDE = 6.0; // Minimum earthquake magnitude to trigger a FlashDAO
const LOG_FILE = path.join(__dirname, '../logs/earthquake_agent.log');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize logger
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Map earthquake magnitude to severity (1-10 scale)
function magnitudeToSeverity(magnitude) {
  // Convert magnitude (typically 0-10 scale) to severity (1-10 scale)
  // Magnitude 5 = Severity 5, 6 = 6, 7 = 7.5, 8 = 9, 9+ = 10
  if (magnitude < 5.0) return Math.max(1, Math.round(magnitude));
  if (magnitude < 6.0) return 5;
  if (magnitude < 7.0) return 6;
  if (magnitude < 8.0) return Math.min(10, Math.round(7 + (magnitude - 7.0) * 2));
  if (magnitude < 9.0) return 9;
  return 10;
}

// Process earthquakes and trigger FlashDAO creation if needed
async function processEarthquakes(earthquakes, agent) {
  for (const earthquake of earthquakes) {
    const { id, properties } = earthquake;
    const { mag, place, time, title } = properties;
    
    if (mag >= MIN_MAGNITUDE) {
      log(`🚨 Significant earthquake detected: ${title}`);
      log(`Magnitude: ${mag}, Location: ${place}`);
      
      // Create descriptive name and details
      const disasterName = `${place} Earthquake`;
      const description = `A magnitude ${mag} earthquake occurred at ${place} on ${new Date(time).toUTCString()}. ` +
        `Immediate humanitarian assistance is needed for affected communities.`;
      
      // Convert magnitude to severity (1-10 scale)
      const severity = magnitudeToSeverity(mag);
      log(`Calculated severity: ${severity}/10`);
      
      // Set funding and voting durations (7 days for funding, 3 days for voting)
      const fundingDuration = 7 * 24 * 60 * 60; // 7 days in seconds
      const votingDuration = 3 * 24 * 60 * 60;  // 3 days in seconds
      
      try {
        // Check if agent has ORACLE_ROLE
        const ORACLE_ROLE = await agent.ORACLE_ROLE();
        const hasRole = await agent.hasRole(ORACLE_ROLE, process.env.ORACLE_ADDRESS);
        
        if (!hasRole) {
          log(`Warning: Oracle address ${process.env.ORACLE_ADDRESS} does not have ORACLE_ROLE`);
          continue;
        }
        
        // Create FlashDAO for this earthquake
        log(`Creating FlashDAO for "${disasterName}"...`);
        
        // Connect with oracle account that has permissions
        const provider = ethers.provider;
        const wallet = new ethers.Wallet(process.env.DEPLOY_WALLET_1, provider);
        const agentWithSigner = agent.connect(wallet);
        
        const tx = await agentWithSigner.detectDisaster(
          disasterName,
          description,
          severity,
          fundingDuration,
          votingDuration
        );
        
        log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        
        // Find the DAOCreated event in the logs
        const daoCreatedEvent = receipt.logs
          .filter(log => log && log.fragment && log.fragment.name === 'DAOCreated')
          .map(log => agent.interface.parseLog({ topics: log.topics, data: log.data }))
          [0];
        
        if (daoCreatedEvent) {
          const daoAddress = daoCreatedEvent.args.daoAddress;
          const fundingGoal = daoCreatedEvent.args.fundingGoal;
          
          log(`✅ FlashDAO created successfully!`);
          log(`DAO Address: ${daoAddress}`);
          log(`Funding Goal: ${ethers.formatUnits(fundingGoal, 6)} USDC`);
          
          // Store the earthquake ID to prevent duplicate processing
          await storeProcessedEarthquake(id);
        } else {
          log(`No DAOCreated event found in transaction ${tx.hash}`);
        }
      } catch (error) {
        log(`Error creating FlashDAO: ${error.message}`);
      }
    }
  }
}

// Keep track of processed earthquakes to avoid duplicates
async function storeProcessedEarthquake(earthquakeId) {
  const processedFile = path.join(__dirname, '../data/processed_earthquakes.json');
  const processedDir = path.dirname(processedFile);
  
  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
  }
  
  let processed = [];
  if (fs.existsSync(processedFile)) {
    processed = JSON.parse(fs.readFileSync(processedFile, 'utf8'));
  }
  
  if (!processed.includes(earthquakeId)) {
    processed.push(earthquakeId);
    fs.writeFileSync(processedFile, JSON.stringify(processed, null, 2));
    log(`Stored earthquake ID ${earthquakeId} as processed`);
  }
}

// Check if an earthquake has already been processed
async function isEarthquakeProcessed(earthquakeId) {
  const processedFile = path.join(__dirname, '../data/processed_earthquakes.json');
  
  if (!fs.existsSync(processedFile)) {
    return false;
  }
  
  const processed = JSON.parse(fs.readFileSync(processedFile, 'utf8'));
  return processed.includes(earthquakeId);
}

// Main function to monitor earthquakes
async function monitorEarthquakes() {
  log('Starting FlashDAO Earthquake Agent...');
  
  try {
    // Get deployed FlashDAOAgent contract
    const FlashDAOAgent = await ethers.getContractFactory('FlashDAOAgent');
    const agentAddress = process.env.AGENT_ADDRESS;
    
    if (!agentAddress) {
      throw new Error('AGENT_ADDRESS not set in .env file');
    }
    
    const agent = FlashDAOAgent.attach(agentAddress);
    log(`Connected to FlashDAOAgent at ${agentAddress}`);
    
    // Main monitoring loop
    setInterval(async () => {
      try {
        log('Checking for new earthquakes...');
        
        // Fetch earthquake data from USGS API
        const response = await axios.get(USGS_EARTHQUAKE_API);
        const { features } = response.data;
        
        log(`Found ${features.length} earthquakes in feed`);
        
        // Filter out already processed earthquakes
        const newEarthquakes = [];
        for (const earthquake of features) {
          if (!(await isEarthquakeProcessed(earthquake.id))) {
            newEarthquakes.push(earthquake);
          }
        }
        
        if (newEarthquakes.length > 0) {
          log(`Processing ${newEarthquakes.length} new earthquakes`);
          await processEarthquakes(newEarthquakes, agent);
        } else {
          log('No new significant earthquakes detected');
        }
      } catch (error) {
        log(`Error in monitoring loop: ${error.message}`);
      }
    }, CHECK_INTERVAL);
    
    log(`Monitoring earthquakes every ${CHECK_INTERVAL / 1000} seconds...`);
  } catch (error) {
    log(`Critical error: ${error.message}`);
    process.exit(1);
  }
}

// Start the earthquake monitoring
monitorEarthquakes().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
}); 