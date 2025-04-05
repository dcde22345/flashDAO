// Event Listener that monitors for disaster events and triggers contract generation
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { handleEvent } = require('./llmContractGenerator');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, '../logs/event_listener.log');

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

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store ongoing events being processed
const ongoingEvents = new Map();

// API endpoint to report a disaster
app.post('/api/report-disaster', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate event data
    if (!eventData.type || !eventData.name || !eventData.description || 
        !eventData.severity || !eventData.location) {
      return res.status(400).json({ success: false, message: 'Missing required event data' });
    }
    
    // Add timestamp if not provided
    if (!eventData.date) {
      eventData.date = new Date().toISOString();
    }
    
    // Create a unique ID for the event
    const eventId = `${eventData.type}-${eventData.name.replace(/\s+/g, '-')}-${Date.now()}`;
    
    log(`Received disaster report: ${eventData.type} - ${eventData.name}`);
    
    // Store the event as being processed
    ongoingEvents.set(eventId, {
      status: 'processing',
      data: eventData,
      timestamp: Date.now()
    });
    
    // Respond immediately that we've received the event
    res.status(202).json({ 
      success: true, 
      message: 'Disaster report received and being processed',
      eventId: eventId
    });
    
    // Process the event asynchronously
    processEvent(eventId, eventData);
  } catch (error) {
    log(`Error handling disaster report: ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API endpoint to get the status of an event
app.get('/api/disaster-status/:eventId', (req, res) => {
  const { eventId } = req.params;
  
  if (!ongoingEvents.has(eventId)) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  
  const event = ongoingEvents.get(eventId);
  res.status(200).json({ success: true, event });
});

// API endpoint to get all ongoing events
app.get('/api/disasters', (req, res) => {
  const events = Array.from(ongoingEvents.entries()).map(([id, event]) => ({
    id,
    ...event
  }));
  
  res.status(200).json({ success: true, events });
});

// Process an event using the LLM contract generator
async function processEvent(eventId, eventData) {
  try {
    // Update status to processing
    updateEventStatus(eventId, 'generating_contract');
    
    // Generate contracts using LLM
    const success = await handleEvent(eventData);
    
    if (success) {
      updateEventStatus(eventId, 'contract_generated', {
        contractName: `${eventData.name.replace(/\s+/g, '')}DAO`,
        factoryName: `${eventData.name.replace(/\s+/g, '')}DAOFactory`,
        readyForDeployment: true
      });
      
      log(`Successfully generated contracts for event ${eventId}`);
    } else {
      updateEventStatus(eventId, 'failed', {
        error: 'Failed to generate contracts'
      });
      
      log(`Failed to generate contracts for event ${eventId}`);
    }
  } catch (error) {
    updateEventStatus(eventId, 'failed', {
      error: error.message
    });
    
    log(`Error processing event ${eventId}: ${error.message}`);
  }
}

// Update the status of an event
function updateEventStatus(eventId, status, additionalData = {}) {
  if (ongoingEvents.has(eventId)) {
    const event = ongoingEvents.get(eventId);
    
    ongoingEvents.set(eventId, {
      ...event,
      status,
      lastUpdated: Date.now(),
      ...additionalData
    });
  }
}

// Cleanup old events periodically (keep for 24 hours)
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [eventId, event] of ongoingEvents.entries()) {
    if (now - event.timestamp > MAX_AGE) {
      ongoingEvents.delete(eventId);
      log(`Removed old event: ${eventId}`);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Start the server
app.listen(PORT, () => {
  log(`Event listener started on port ${PORT}`);
  log(`Waiting for disaster reports...`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Event listener shutting down');
  process.exit(0);
}); 