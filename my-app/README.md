# DropIt - AI-Powered Negotiation Platform

DropIt uses advanced AI to automatically handle customer service calls, negotiate refunds, and resolve issues on your behalf.

## Features

- **Automated Negotiation**: AI agent makes calls and negotiates with customer service
- **Multiple Request Types**: Handles refunds, returns, subscription cancellations
- **Order Validation**: Requires order number OR screenshot before starting
- **Real-time Status**: Live updates on negotiation progress
- **Confirmation Codes**: Always requests confirmation codes for transactions

## Setup & Run Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the backend server:**
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:3001`

3. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:
```env
VAPI_API_KEY=fd153d6a-4097-4b26-acbb-df0bba92d01a
VAPI_PHONE_NUMBER=+15719329354
PORT=3001
```

## How It Works

### User Flow

1. **User opens frontend** → Selects "Return Order" service
2. **Provides request details:**
   - Text prompt (e.g., "Get me a refund for my Chipotle order")
   - Order number OR screenshot upload
3. **Backend validation:**
   - Rejects if no order number or screenshot provided
   - Otherwise forwards to Vapi
4. **Vapi agent makes call** to mock customer service
5. **AI negotiates** with CSR, insisting on full refunds when needed
6. **Agent requests confirmation code** before ending call
7. **Result posted** to backend `/log` webhook
8. **Frontend polls** `/status` and displays outcome

### API Endpoints

- `POST /start` - Start negotiation with user prompt + order details
- `GET /status/:id` - Get current negotiation status
- `POST /log` - Webhook for Vapi to post results
- `POST /mock-csr` - Mock customer service API for testing

### Vapi Integration

The system uses Vapi's voice AI to:
- Make calls to customer service
- Use dynamic prompts based on request type
- Negotiate persistently but politely
- Always request confirmation codes
- Post results back to webhook

## Testing

1. Open `http://localhost:3000`
2. Click "Return Order"
3. Enter a request like "Get me a refund for my Chipotle order"
4. Provide an order number (e.g., "12345")
5. Click "Start AI Call"
6. Watch the negotiation progress
7. See the final result with confirmation code

## Mock Responses

The system includes realistic mock responses:
- **Refund**: "I can only offer $5 credit" → "Okay, $12 refund approved"
- **Return**: "15% restocking fee" → "Return approved, prepaid label sent"
- **Subscription**: "End of billing cycle" → "Cancellation processed, $24.50 refund"

## Production Deployment

For production:
1. Replace mock CSR with real customer service APIs
2. Add proper database storage
3. Implement authentication
4. Add error handling and logging
5. Configure Vapi webhook URLs
6. Add rate limiting and security

## Architecture

```
Frontend (Next.js) → Backend (Express) → Vapi API → Customer Service
     ↓                    ↓                ↓
   Status Polling    Negotiation State   Voice Call
```

The system maintains state through the negotiation process and provides real-time updates to the user interface.