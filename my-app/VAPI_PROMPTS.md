# Vapi Configuration - 5 Specialized Prompts

## Overview
The Vapi integration now includes 5 specialized prompts based on the request type, each with specific phone numbers and tailored instructions.

## Phone Number Configuration

| Role | Phone Number | Purpose |
|------|-------------|---------|
| **Agent Phone** | `+15719329354` | The Vapi agent that makes the calls |
| **Customer Phone** | User Input | The phone number entered in the form |

**How it works**: The agent phone number `+15719329354` calls the customer's phone number that they provide in the form.

## Specialized Prompts

### 1. Return/Refund Request (`return-order`)
**Agent Calls**: Customer's phone number from form

**Customer Data Used**:
- Full Name
- Phone Number (required)
- User Message (specific request)
- Order Number or Screenshot reference

**Prompt Focus**:
- Professional return/refund negotiation
- Insist on full refund amount (not store credit)
- Ensure free return shipping and no restocking fees
- Request confirmation codes

**Example Call Start**:
> "Hello, I'm calling on behalf of [Customer Name] about a return/refund request for order [Order Number]."

### 2. Subscription Cancellation (`cancel-subscription`)
**Agent Calls**: Customer's phone number from form

**Customer Data Used**:
- Full Name
- Email Address
- Phone Number (required)
- User Message (cancellation request)

**Prompt Focus**:
- Immediate cancellation (not end of billing cycle)
- Decline retention offers
- Request prorated refund for unused period
- Ensure no future charges
- Get cancellation confirmation

**Example Call Start**:
> "Hello, I'm calling to cancel a subscription for [Customer Name] with email [Email Address]."

### 3a. Book Appointment (`book-appointment`)
**Agent Calls**: Customer's phone number from form

**Customer Data Used**:
- Full Name
- Phone Number (required)
- User Message (booking request)
- Appointment Time (preferred time)
- Appointment Action (book)

**Prompt Focus**:
- Professional appointment booking
- Confirm all details (date, time, location, preparation needed)
- Ask about confirmation methods (email, SMS)
- Inquire about cancellation/rescheduling policies
- Get confirmation numbers

**Example Call Start**:
> "Hello, I'm calling to book an appointment for [Customer Name]."

### 3b. Cancel Appointment (`cancel-appointment`)
**Agent Calls**: Customer's phone number from form

**Customer Data Used**:
- Full Name
- Phone Number (required)
- User Message (cancellation request)
- Appointment Time (time to cancel)
- Appointment Action (cancel)

**Prompt Focus**:
- Professional appointment cancellation
- Confirm cancellation policies and any fees
- Ask about rescheduling options if appropriate
- Get cancellation confirmation numbers

**Example Call Start**:
> "Hello, I'm calling to cancel an appointment for [Customer Name]."

### 4. General Customer Service (`default`)
**Agent Calls**: Customer's phone number from form

**Customer Data Used**:
- Full Name
- Phone Number (required)
- User Message (general request)
- Reference information

**Prompt Focus**:
- Professional general customer service
- Clear explanation of customer situation
- Work towards best possible resolution
- Get reference numbers

**Example Call Start**:
> "Hello, I'm calling on behalf of [Customer Name] about: [User Message]."

## Form Data Integration

Each form type collects specific data that gets passed to the appropriate prompt:

### Return Order Form
- ✅ User Message (request details)
- ✅ Order Number (optional)
- ✅ Screenshot upload (optional)
- ✅ Full Name

### Cancel Subscription Form
- ✅ Email Address
- ✅ Full Name
- ✅ Phone Number

### Appointment Form
- ✅ Appointment Time to Cancel/Book
- ✅ Full Name

## Technical Implementation

### Backend (server.js)
```javascript
const customerData = {
  fullName: fullName || '',
  email: email || '',
  phoneNumber: phoneNumber || '',
  appointmentTime: appointmentTime || ''
};

const callResult = await vapi.startCall(userMessage, orderNumber, screenshotUrl, customerData);
```

### Vapi Config (vapi-config.js)
```javascript
const systemPrompt = this.getSystemPrompt(requestType, userMessage, orderNumber, customerData);
const phoneNumber = this.phoneNumbers[requestType] || this.phoneNumbers.default;
```

### Frontend (page.tsx)
```javascript
// Add customer data based on selected option
if (formData.fullName) {
  requestData.append('fullName', formData.fullName)
}
if (formData.email) {
  requestData.append('email', formData.email)
}
// ... etc
```

## Webhook Integration

All prompts include instructions to POST results to:
```
POST http://localhost:3001/log
Body: { 
  "refund": "resolution_details", 
  "code": "confirmation_code", 
  "callId": "call_id" 
}
```

## Configuration Files

- **`vapi-config.js`**: Contains all 4 specialized prompts and phone number mappings
- **`server.js`**: Updated to extract and pass customer data
- **`app/page.tsx`**: Updated to send customer data with requests

This setup ensures that each request type gets the most appropriate and effective AI prompt for the specific service being requested.
