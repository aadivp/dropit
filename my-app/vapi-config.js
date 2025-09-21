const axios = require('axios');

class VapiIntegration {
  constructor() {
    this.apiKey = 'fd153d6a-4097-4b26-acbb-df0bba92d01a';
    this.baseURL = 'https://api.vapi.ai';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // The agent phone number that will make the calls
    this.agentPhoneNumber = '+15719329354';
    this.phoneNumberId = null;
    
    // Initialize phone number ID
    this.initializePhoneNumber();
  }

  async initializePhoneNumber() {
    try {
      const phoneNumbers = await this.getPhoneNumbers();
      console.log('Available phone numbers:', phoneNumbers);
      
      // Find our phone number in the list
      const ourPhoneNumber = phoneNumbers.find(phone => 
        phone.number === this.agentPhoneNumber || 
        phone.number === '15719329354' ||
        phone.number === '+15719329354'
      );
      
      if (ourPhoneNumber) {
        this.phoneNumberId = ourPhoneNumber.id;
        console.log('Found phone number ID:', this.phoneNumberId);
      } else {
        console.log('Phone number not found in Vapi account. Available numbers:', phoneNumbers.map(p => p.number));
      }
    } catch (error) {
      console.error('Error initializing phone number:', error.response?.data || error.message);
    }
  }

  // Update existing assistant with dynamic prompt based on user request
  async updateAssistant(userMessage, orderNumber, screenshotUrl, requestType, customerData = {}) {
    console.log('Environment check:');
    console.log('VAPI_ASSISTANT_ID:', process.env.VAPI_ASSISTANT_ID);
    console.log('VAPI_API_KEY:', process.env.VAPI_API_KEY ? 'SET' : 'NOT SET');
    
    const assistantId = '67761772-a30b-4aee-8ef2-67bc30b136a9';
    console.log('Using Assistant ID:', assistantId);
    
    // Determine the specific system prompt based on request type
    const systemPrompt = this.getSystemPrompt(requestType, userMessage, orderNumber, customerData);
    
    const assistantConfig = {
      name: `DropIt - ${requestType}`,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ]
      },
      voice: {
        provider: "vapi",
        voiceId: "Cole"
      },
      firstMessage: "Hello.",
      voicemailMessage: "Please call back when you're available.",
      endCallMessage: "Goodbye.",
      transcriber: {
        model: "nova-2",
        language: "en",
        provider: "deepgram"
      }
    };

    try {
      // Update the existing assistant with the new configuration
      const response = await axios.patch(
        `${this.baseURL}/assistant/${assistantId}`,
        assistantConfig,
        { headers: this.headers }
      );
      
      console.log('Assistant updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  // Detect request type from user message
  detectRequestType(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('refund') || message.includes('money back')) {
      return 'refund';
    } else if (message.includes('return') || message.includes('send back')) {
      return 'return';
    } else if (message.includes('book') && (message.includes('appointment') || message.includes('booking'))) {
      return 'book-appointment';
    } else if (message.includes('cancel') && (message.includes('appointment') || message.includes('booking'))) {
      return 'cancel-appointment';
    } else if (message.includes('cancel') || message.includes('subscription') || message.includes('rate')) {
      return 'subscription';
    } else {
      return 'general';
    }
  }

  // Get system prompt based on request type
  getSystemPrompt(requestType, userMessage, orderNumber, customerData = {}) {
    const basePrompt = `You are a professional AI assistant calling customer service on behalf of a customer. You have the following information:
- Customer Name: ${customerData.fullName || 'Not provided'}
- Customer Phone: ${customerData.phoneNumber || 'Not provided'}
- Customer Request: "${userMessage}"
- Order/Reference Number: "${orderNumber || 'Not provided - customer has screenshot'}"
- Request Type: ${requestType}

You are calling to resolve this issue. Be polite, professional, and persistent.`;

    switch (requestType.toLowerCase()) {
      case 'refund':
        return `${basePrompt}

SPECIFIC INSTRUCTIONS FOR REFUND REQUESTS:
1. Start by saying: "Hello, I'm calling about a refund request for order ${orderNumber || 'the attached screenshot'}."
2. Explain the customer's situation and why they need a refund.
3. If offered a partial refund, politely insist on the full amount with valid reasoning.
4. Always ask for a confirmation code or reference number at the end.
5. End with: "Thank you for your help. Could I get a confirmation code for this refund?"

REMEMBER: Be firm but respectful. The customer deserves a fair resolution.`;

      case 'return':
        return `${basePrompt}

SPECIFIC INSTRUCTIONS FOR RETURN REQUESTS:
1. Start by saying: "Hello, I'm calling about a return request for order ${orderNumber || 'the attached screenshot'}."
2. Explain what the customer wants to return and why.
3. Generate questions to ask about the return process and timeline.
4. Draft questions about return policy details and restocking fees and confirm with the customer.
5. Get confirmation code or return authorization number.
6. Generate a script for explaining what item needs to be returned and why
7. End with: "Thank you. Could I get a return authorization number or confirmation code?"

REMEMBER: Ensure the customer understands the return process completely.`;

      case 'book-appointment':
        return `${basePrompt}

SPECIFIC INSTRUCTIONS FOR BOOKING APPOINTMENTS:
1. Start by saying: "Hello, I'm calling to book an appointment for ${customerData.fullName || 'a customer'}."
2. Provide preferred time: ${customerData.appointmentTime || 'Not specified - ask for available times'}.
3. Confirm all appointment details (date, time, location, any preparation needed).
4. Ask about appointment confirmation methods (email, SMS).
5. Inquire about cancellation/rescheduling policies.
6. Get appointment confirmation number and any reference details.
7. End with: "Thank you. Could I get an appointment confirmation number and details?"

REMEMBER: Ensure all appointment details are confirmed and the customer gets proper confirmation.`;

      case 'cancel-appointment':
        return `${basePrompt}

SPECIFIC INSTRUCTIONS FOR APPOINTMENT CANCELLATIONS:
1. Start by saying: "Hello, I'm calling to cancel an appointment for ${customerData.fullName || 'a customer'}."
2. Provide appointment details: ${customerData.appointmentTime || 'Will provide details when asked'}.
3. Confirm cancellation policy and any fees.
4. Ask about rescheduling options if appropriate.
5. Get confirmation of cancellation.
6. End with: "Thank you. Could I get a cancellation confirmation number?"

REMEMBER: Be clear about cancellation policies and any associated fees.`;

      case 'subscription':
        return `${basePrompt}

SPECIFIC INSTRUCTIONS FOR SUBSCRIPTION CANCELLATIONS:
1. Start by saying: "Hello, I'm calling about my bill ${orderNumber || 'account'}."
2. Generate an opening statement for canceling a subscription with account number ABC123.
3. Generate an explanation for canceling because the service doesn't meet expectations.
4. Create a script for canceling due to duplicate charges or billing errors.
5. Generate a script for canceling due to technical issues with the service.
6. Write a script for disputing incorrect charges before canceling.
7. Be persistent but respectful in seeking fair resolution.
8. Get confirmation of any changes made to the account.
9. End with: "Thank you. Could I get a confirmation code for these changes?"

REMEMBER: It may take time. Be patient but persistent.`;

      default:
        return `${basePrompt}

GENERAL INSTRUCTIONS:
1. Start by saying: "Hello, I'm calling about ${orderNumber || 'the attached screenshot'}."
2. Clearly explain the customer's request: "${userMessage}"
3. Work with the representative to resolve the issue.
4. Be persistent but always professional and polite.
5. Always ask for a confirmation code or reference number.
6. End with: "Thank you for your help. Could I get a confirmation code for this?"

REMEMBER: Your goal is to get the best possible outcome for the customer.`;
    }
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    
    // If it's 10 digits, assume US and add +1
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    
    // If it already starts with +, check if it's a valid US number
    if (phoneNumber.startsWith('+')) {
      // If it's 11 digits after + but doesn't start with 1, it's invalid
      if (cleaned.length === 10) {
        return '+1' + cleaned;
      }
      // If it's already properly formatted, return as is
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return phoneNumber;
      }
    }
    
    // Otherwise, return the original
    return phoneNumber;
  }

  // Validate E.164 phone number
  isValidE164(phoneNumber) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const isValid = e164Regex.test(phoneNumber);
    console.log(`Phone number validation: ${phoneNumber} -> ${isValid}`);
    return isValid;
  }

  // Start a call with the assistant
  async startCall(userMessage, orderNumber, screenshotUrl = null, customerData = {}) {
    // Detect request type from user message
    const requestType = this.detectRequestType(userMessage);
    
    // Format customer phone number
    const customerPhoneNumber = this.formatPhoneNumber(customerData.phoneNumber);
    
    if (!customerData.phoneNumber) {
      throw new Error('Customer phone number is required to make the call');
    }
    
    // Validate phone number format
    if (!this.isValidE164(customerPhoneNumber)) {
      throw new Error(`Invalid phone number format: ${customerPhoneNumber}. Must be in E.164 format (e.g., +15551234567)`);
    }
    
    console.log('Original phone number:', customerData.phoneNumber);
    console.log('Formatted phone number:', customerPhoneNumber);
    console.log('Phone number valid:', this.isValidE164(customerPhoneNumber));
    
    // Update the existing assistant with the new configuration
    await this.updateAssistant(userMessage, orderNumber, screenshotUrl, requestType, customerData);
    
    const callConfig = {
      assistantId: '67761772-a30b-4aee-8ef2-67bc30b136a9',
      phoneNumberId: this.phoneNumberId,
      customer: {
        number: customerPhoneNumber
      },
      metadata: {
        userMessage: userMessage,
        orderNumber: orderNumber,
        screenshotUrl: screenshotUrl,
        requestType: requestType,
        customerData: customerData,
        startTime: new Date().toISOString()
      }
    };

    console.log('Call config being sent:', JSON.stringify(callConfig, null, 2));

    try {
      const response = await axios.post(
        `${this.baseURL}/call`,
        callConfig,
        { headers: this.headers }
      );
      
      console.log('Call started:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting call:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call status
  async getCallStatus(callId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${callId}`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting call status:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call summary and transcript
  async getCallSummary(callId) {
    try {
      const callData = await this.getCallStatus(callId);
      const transcript = await this.getCallTranscript(callId);
      
      return {
        status: callData.status,
        duration: callData.duration,
        transcript: transcript,
        summary: this.generateCallSummary(callData, transcript)
      };
    } catch (error) {
      console.error('Error getting call summary:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate a summary of the call
  generateCallSummary(callData, transcript) {
    if (callData.status === 'ended' && transcript) {
      return {
        outcome: "Call completed successfully",
        duration: `${Math.round(callData.duration / 60)} minutes`,
        keyPoints: this.extractKeyPoints(transcript),
        result: this.determineResult(transcript)
      };
    } else if (callData.status === 'failed') {
      return {
        outcome: "Call failed",
        duration: "0 minutes",
        keyPoints: ["Call could not be completed"],
        result: "No resolution achieved"
      };
    } else {
      return {
        outcome: "Call in progress",
        duration: "Ongoing",
        keyPoints: ["Call is still active"],
        result: "Pending"
      };
    }
  }

  // Extract key points from transcript
  extractKeyPoints(transcript) {
    // Simple extraction - in a real app you'd use more sophisticated NLP
    const keyPoints = [];
    
    if (transcript.toLowerCase().includes('refund')) {
      keyPoints.push('Refund discussed');
    }
    if (transcript.toLowerCase().includes('cancel')) {
      keyPoints.push('Cancellation processed');
    }
    if (transcript.toLowerCase().includes('confirmation')) {
      keyPoints.push('Confirmation provided');
    }
    if (transcript.toLowerCase().includes('code')) {
      keyPoints.push('Reference code provided');
    }
    
    return keyPoints.length > 0 ? keyPoints : ['General discussion completed'];
  }

  // Determine the result based on transcript
  determineResult(transcript) {
    const text = transcript.toLowerCase();
    
    if (text.includes('approved') || text.includes('processed')) {
      return 'Request approved and processed';
    } else if (text.includes('pending') || text.includes('review')) {
      return 'Request under review';
    } else if (text.includes('denied') || text.includes('rejected')) {
      return 'Request denied';
    } else {
      return 'Resolution pending';
    }
  }

  // End a call
  async endCall(callId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/call/${callId}/end`,
        {},
        { headers: this.headers }
      );
      
      console.log('Call ended:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call recording URL
  async getCallRecording(callId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${callId}`,
        { headers: this.headers }
      );
      
      return {
        recordingUrl: response.data.recordingUrl,
        transcriptionUrl: response.data.transcriptionUrl,
        duration: response.data.duration
      };
    } catch (error) {
      console.error('Error getting call recording:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call transcript
  async getCallTranscript(callId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${callId}/transcript`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting call transcript:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call events (real-time monitoring)
  async getCallEvents(callId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${callId}/events`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting call events:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get all calls with filtering
  async getAllCalls(limit = 50, offset = 0) {
    try {
      const response = await axios.get(
        `${this.baseURL}/call?limit=${limit}&offset=${offset}`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting all calls:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get all phone numbers
  async getPhoneNumbers() {
    try {
      const response = await axios.get(
        `${this.baseURL}/phone-number`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting phone numbers:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = VapiIntegration;