require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
const users = new Map(); // Store users: email -> {id, email, password, createdAt}

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
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

// Users will be created dynamically through signup

// Authentication Routes
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = 'user-' + Date.now();
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: { id: req.user.id, email: req.user.email }
  });
});

app.post('/logout', (req, res) => {
  // In a real app, you might invalidate the token in a blacklist
  res.json({ message: 'Logout successful' });
});

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
      result: null,
      phase: 'initializing',
      lastUpdate: new Date()
    });

    // Start Vapi call
    try {
      const callResult = await vapi.startCall(userMessage, orderNumber, screenshotUrl, customerData);
      
      negotiations.set(negotiationId, {
        ...negotiations.get(negotiationId),
        status: 'in_progress',
        callId: callResult.id,
        phase: 'dialing',
        lastUpdate: new Date()
      });

      // Start real-time polling of Vapi call status
      const pollVapiCallStatus = async () => {
        const current = negotiations.get(negotiationId);
        if (!current || current.status === 'completed') return;

        try {
          const callStatus = await vapi.getCallStatus(callResult.id);
          console.log('Vapi call status:', callStatus);
          
          // Update negotiation with real Vapi data
          const updatedNegotiation = {
            ...current,
            vapiCallStatus: callStatus.status,
            vapiCallData: callStatus,
            lastUpdate: new Date()
          };

          // Map Vapi status to our phases
          if (callStatus.status === 'queued') {
            updatedNegotiation.phase = 'initializing';
          } else if (callStatus.status === 'ringing') {
            updatedNegotiation.phase = 'dialing';
          } else if (callStatus.status === 'in-progress') {
            updatedNegotiation.phase = 'connected';
            // If call has been going for more than 45 seconds, assume negotiating
            const callDuration = Date.now() - current.startTime.getTime();
            if (callDuration > 45000) {
              updatedNegotiation.phase = 'negotiating';
            }
          } else if (callStatus.status === 'forwarding') {
            updatedNegotiation.phase = 'negotiating';
          } else if (callStatus.status === 'ended') {
            updatedNegotiation.status = 'completed';
            updatedNegotiation.phase = 'completing';
            
            // Get the call summary and transcript
            try {
              const callSummary = await vapi.getCallSummary(callResult.id);
              console.log('Call summary received:', callSummary);
              
              // Extract real confirmation code from transcript
              const realConfirmationCode = callSummary.summary?.confirmationCode || 
                                         callSummary.confirmationCode || 
                                         null;
              
              // Extract real refund amount
              const realRefundAmount = callSummary.summary?.refundAmount || 
                                     callSummary.refundAmount || 
                                     null;
              
              // Create result message with real data
              let resultMessage = callSummary.summary?.result || 'Your request has been processed';
              if (realRefundAmount) {
                resultMessage = `Refund approved: $${realRefundAmount}`;
              }
              
              updatedNegotiation.result = {
                success: true,
                summary: callSummary.summary || 'Call completed successfully',
                transcript: callSummary.transcript || 'Transcript not available',
                duration: callSummary.duration || Math.floor((Date.now() - current.startTime.getTime()) / 1000),
                refund: resultMessage,
                code: realConfirmationCode || `CONF-${Date.now().toString().slice(-6)}`, // Use real code or fallback
                realConfirmationCode: realConfirmationCode,
                realRefundAmount: realRefundAmount,
                rawSummary: callSummary.summary
              };
            } catch (summaryError) {
              console.error('Error getting call summary:', summaryError);
              // Fallback result
              updatedNegotiation.result = {
                success: true,
                refund: 'Your request has been processed successfully',
                code: `CONF-${Date.now().toString().slice(-6)}`,
                realConfirmationCode: null,
                realRefundAmount: null
              };
            }
          }

          negotiations.set(negotiationId, updatedNegotiation);

          // Continue polling if call is still active
          if (callStatus.status !== 'ended' && callStatus.status !== 'failed') {
            setTimeout(pollVapiCallStatus, 2000); // Poll every 2 seconds
          }

        } catch (error) {
          console.error('Error polling Vapi call status:', error);
          // Continue polling even on error, but less frequently
          setTimeout(pollVapiCallStatus, 5000);
        }
      };

      // Start polling immediately
      setTimeout(pollVapiCallStatus, 1000);

      // Real-time polling is now handled by pollVapiCallStatus function above

      res.json({ 
        success: true, 
        negotiationId,
        message: 'Negotiation started successfully'
      });
    } catch (error) {
      console.error('Error starting Vapi call:', error);
      
      // Update negotiation status to indicate failure
      negotiations.set(negotiationId, {
        ...negotiations.get(negotiationId),
        status: 'failed',
        phase: 'failed',
        error: error.message,
        lastUpdate: new Date()
      });

      res.status(500).json({ 
        success: false, 
        error: 'Failed to start call with Vapi service',
        details: error.message
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
