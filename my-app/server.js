require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const VapiIntegration = require('./vapi-config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// In-memory storage for demo (use database in production)
const negotiations = new Map();
const mockCSRResponses = {
  refund: {
    initial: "I can only offer a $5 credit to your account.",
    persistent: "Let me check with my supervisor... I can offer $10 credit.",
    final: "Okay, I can approve a $12 refund to your original payment method."
  },
  return: {
    initial: "Returns are subject to a 15% restocking fee.",
    persistent: "I can waive the restocking fee for you.",
    final: "Return approved. You'll receive a prepaid return label via email."
  },
  subscription: {
    initial: "Cancellation will be effective at the end of your billing cycle.",
    persistent: "I can offer you 50% off for the next 3 months.",
    final: "Cancellation processed. You'll receive a prorated refund of $24.50."
  }
};

// Initialize Vapi Integration
const vapi = new VapiIntegration();

// Test endpoint to check phone number setup
app.get('/test-phone', async (req, res) => {
  try {
    const phoneNumbers = await vapi.getPhoneNumbers();
    res.json({
      success: true,
      phoneNumbers: phoneNumbers,
      agentPhoneNumber: vapi.agentPhoneNumber,
      phoneNumberId: vapi.phoneNumberId,
      message: 'Phone number configuration is ready!'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      agentPhoneNumber: vapi.agentPhoneNumber,
      phoneNumberId: vapi.phoneNumberId
    });
  }
});

// Test endpoint to make a test call
app.post('/test-call', async (req, res) => {
  try {
    const testCustomerData = {
      fullName: 'Test User',
      phoneNumber: '+14155552671', // Test with a known valid format
      email: 'test@example.com'
    };
    
    const result = await vapi.startCall(
      'I want a refund for my order',
      'TEST123',
      null,
      testCustomerData
    );
    
    res.json({
      success: true,
      result: result,
      message: 'Test call initiated!'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Routes

// Start negotiation
app.post('/start', upload.single('screenshot'), async (req, res) => {
  try {
    const { userMessage, orderNumber, fullName, email, phoneNumber, appointmentTime, appointmentAction } = req.body;
    
    console.log('Received form data:', {
      userMessage,
      orderNumber,
      fullName,
      email,
      phoneNumber,
      appointmentTime,
      appointmentAction
    });
    
    // Validation
    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }
    
    // Only require order number or screenshot for return-order type
    if (userMessage.toLowerCase().includes('refund') || userMessage.toLowerCase().includes('return')) {
      if (!orderNumber && !req.file) {
        return res.status(400).json({ error: 'Either order number or screenshot is required for returns/refunds' });
      }
    }
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required to make the call' });
    }

    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const negotiationId = Date.now().toString();
    
    // Prepare customer data based on form type
    const customerData = {
      fullName: fullName || '',
      email: email || '',
      phoneNumber: phoneNumber || '',
      appointmentTime: appointmentTime || '',
      appointmentAction: appointmentAction || ''
    };
    
    // Store negotiation state
    negotiations.set(negotiationId, {
      id: negotiationId,
      status: 'starting',
      userMessage,
      orderNumber,
      screenshotUrl,
      customerData,
      startTime: new Date(),
      result: null
    });

    // Start Vapi call
    try {
      const callResult = await vapi.startCall(userMessage, orderNumber, screenshotUrl, customerData);
      
      negotiations.set(negotiationId, {
        ...negotiations.get(negotiationId),
        status: 'in_progress',
        callId: callResult.id
      });

      // Start polling for call completion
      setTimeout(async () => {
        try {
          const callSummary = await vapi.getCallSummary(callResult.id);
          negotiations.set(negotiationId, {
            ...negotiations.get(negotiationId),
            status: 'completed',
            result: {
              success: true,
              summary: callSummary.summary,
              transcript: callSummary.transcript,
              duration: callSummary.duration
            }
          });
        } catch (error) {
          console.error('Error getting call summary:', error);
          // Fallback to mock result
          const mockResult = simulateNegotiation(userMessage);
          negotiations.set(negotiationId, {
            ...negotiations.get(negotiationId),
            status: 'completed',
            result: mockResult
          });
        }
      }, 30000); // Check after 30 seconds

      res.json({ 
        success: true, 
        negotiationId,
        message: 'Negotiation started successfully'
      });
    } catch (error) {
      // For demo purposes, simulate a successful call
      setTimeout(() => {
        const mockResult = simulateNegotiation(userMessage);
        negotiations.set(negotiationId, {
          ...negotiations.get(negotiationId),
          status: 'completed',
          result: mockResult
        });
      }, 5000);

      res.json({ 
        success: true, 
        negotiationId,
        message: 'Negotiation started (simulated)'
      });
    }
  } catch (error) {
    console.error('Error starting negotiation:', error);
    res.status(500).json({ error: 'Failed to start negotiation' });
  }
});

// Get negotiation status
app.get('/status/:id', (req, res) => {
  const negotiation = negotiations.get(req.params.id);
  
  if (!negotiation) {
    return res.status(404).json({ error: 'Negotiation not found' });
  }
  
  res.json(negotiation);
});

// Webhook for Vapi to post results
app.post('/log', (req, res) => {
  try {
    const { refund, code, callId } = req.body;
    
    // Find negotiation by callId
    let negotiation = null;
    for (const [id, neg] of negotiations.entries()) {
      if (neg.callId === callId) {
        negotiation = neg;
        break;
      }
    }
    
    if (negotiation) {
      negotiations.set(negotiation.id, {
        ...negotiation,
        status: 'completed',
        result: { refund, code, completedAt: new Date() }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging result:', error);
    res.status(500).json({ error: 'Failed to log result' });
  }
});

// Mock CSR API endpoint
app.post('/mock-csr', (req, res) => {
  const { requestType, persistence } = req.body;
  
  const responses = mockCSRResponses[requestType] || mockCSRResponses.refund;
  let response;
  
  if (persistence === 'initial') {
    response = responses.initial;
  } else if (persistence === 'persistent') {
    response = responses.persistent;
  } else {
    response = responses.final;
  }
  
  res.json({ 
    response,
    confirmationCode: `CSR-${Date.now().toString().slice(-6)}`
  });
});

// Simulate negotiation for demo
function simulateNegotiation(userMessage) {
  const requestType = vapi.detectRequestType(userMessage);
  const responses = mockCSRResponses[requestType] || mockCSRResponses.refund;
  
  return {
    refund: responses.final,
    code: `CSR-${Date.now().toString().slice(-6)}`,
    completedAt: new Date()
  };
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
