# DropIt - AI-Powered Negotiation Platform

DropIt uses advanced AI to automatically handle customer service calls, negotiate refunds, and resolve issues on your behalf.

## ✨ Features

### 🤖 AI-Powered Negotiation
- **Automated Calls**: AI agent makes calls and negotiates with customer service
- **Multiple Request Types**: Handles refunds, returns, subscription cancellations, appointments
- **Smart Order Validation**: Requires order number OR screenshot before starting
- **Real-time Status Tracking**: Live updates on negotiation progress with phase-by-phase visualization

### 🔐 User Authentication
- **Secure Login/Signup**: JWT-based authentication system
- **User Session Management**: Persistent login with automatic token verification
- **Dynamic UI**: Shows user email when logged in, "Sign In" when not authenticated

### 📞 Advanced Call Management
- **Real-time Call Progress**: Live duration timer and phase tracking
- **Vapi Integration**: Direct integration with Vapi API for real call data
- **Smart Confirmation Code Extraction**: Automatically extracts real confirmation codes from call transcripts
- **Fallback System**: Uses real codes when available, fallback codes when not found
- **Debug Information**: Shows raw call data and extraction results

### 🎯 Call Progress Visualization
- **Phase Tracking**: Initializing → Dialing → Connected → Negotiating → Completing
- **Live Updates**: Real-time status messages and progress indicators
- **Duration Timer**: Accurate call duration tracking from start to finish
- **Visual Progress Bar**: Interactive progress visualization with completion indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd dropit
   ```

2. **Install dependencies:**
   ```bash
   cd my-app
   npm install --legacy-peer-deps
   ```

3. **Start both servers (recommended):**
   ```bash
   npm run dev:full
   ```
   This starts both backend (port 3001) and frontend (port 3000) simultaneously.

   **OR start individually:**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Environment Variables

Create a `.env` file in the root directory:
```env
VAPI_API_KEY=fd153d6a-4097-4b26-acbb-df0bba92d01a
VAPI_PHONE_NUMBER=+15719329354
PORT=3001
```

## 🔄 How It Works

### User Flow

1. **User Authentication** → Sign up/Login with email and password
2. **Service Selection** → Choose from Return Order, Cancel Subscription, or Book/Cancel Appointment
3. **Request Details** → Provide:
   - Text prompt (e.g., "Get me a refund for my Chipotle order")
   - Order number OR screenshot upload (for returns)
   - Contact information (phone number required)
4. **Real-time Call Progress** → Watch live updates:
   - Phase tracking (Initializing → Dialing → Connected → Negotiating → Completing)
   - Live duration timer
   - Real-time status messages
5. **AI Negotiation** → Vapi agent:
   - Makes call to customer service
   - Negotiates persistently but politely
   - Requests confirmation codes
   - Extracts real confirmation codes from transcript
6. **Results Display** → Shows:
   - Real confirmation codes (green) or fallback codes (yellow)
   - Refund amounts when mentioned
   - Call duration and summary
   - Debug information for verification

### 🔌 API Endpoints

#### Authentication
- `POST /signup` - User registration
- `POST /login` - User authentication
- `GET /verify-token` - Token verification
- `POST /logout` - User logout

#### Negotiation
- `POST /start` - Start negotiation with user prompt + order details
- `GET /status/:id` - Get current negotiation status with real-time updates
- `POST /log` - Webhook for Vapi to post results
- `GET /test-phone` - Test Vapi phone number configuration

### 🤖 Vapi Integration

The system uses Vapi's voice AI with advanced features:
- **Real-time Call Status**: Polls Vapi API every 2 seconds for live updates
- **Smart Prompt Selection**: Dynamic prompts based on request type (return, cancellation, appointment)
- **Confirmation Code Extraction**: Automatically extracts real codes from call transcripts
- **Refund Amount Detection**: Identifies and extracts refund amounts from conversations
- **Fallback System**: Graceful handling when real data isn't available
- **Error Handling**: Comprehensive error management and user feedback

## 🧪 Testing the Application

### Basic Test Flow
1. **Open** http://localhost:3000
2. **Sign Up/Login** with your email and password
3. **Select Service** (Return Order, Cancel Subscription, or Appointment)
4. **Fill Form** with your request details
5. **Start AI Call** and watch real-time progress
6. **View Results** with real confirmation codes and debug info

### Advanced Testing
- **Real Confirmation Codes**: Look for green "✅ Real confirmation code from call"
- **Fallback Codes**: Look for yellow "⚠️ Fallback code (no code found in transcript)"
- **Debug Information**: Click "🔍 Debug: Raw Call Data" to see extraction details
- **Call Progress**: Watch phase transitions and live duration timer

### Test Scenarios
- **Return Order**: Upload screenshot or provide order number
- **Subscription Cancellation**: Provide email and phone number
- **Appointment Management**: Book or cancel appointments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Vapi API      │    │ Customer Service│
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Voice AI)    │◄──►│   (Real Calls)  │
│                 │    │                 │    │                 │    │                 │
│ • Authentication│    │ • JWT Auth      │    │ • Call Status   │    │ • CSR Agents    │
│ • Real-time UI  │    │ • Real-time     │    │ • Transcripts   │    │ • Confirmation  │
│ • Progress      │    │   Polling       │    │ • Confirmation  │    │   Codes         │
│   Tracking      │    │ • Code          │    │   Codes         │    │ • Refund        │
│ • User Session  │    │   Extraction    │    │ • Refund        │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components
- **Frontend**: React/Next.js with real-time status updates and user authentication
- **Backend**: Express.js with JWT authentication and real-time Vapi API polling
- **Vapi Integration**: Voice AI for making calls and extracting confirmation codes
- **Real-time Updates**: 2-second polling for live call status and progress tracking

## 🚀 Production Deployment

### Ready for Production
- ✅ **Authentication**: JWT-based user authentication system
- ✅ **Error Handling**: Comprehensive error management and user feedback
- ✅ **Real-time Updates**: Live call status and progress tracking
- ✅ **Confirmation Code Extraction**: Smart extraction from real call transcripts
- ✅ **Fallback Systems**: Graceful handling when real data isn't available

### Production Checklist
- [ ] Replace mock CSR with real customer service APIs
- [ ] Add proper database storage (PostgreSQL/MongoDB)
- [ ] Configure production Vapi webhook URLs
- [ ] Add rate limiting and security middleware
- [ ] Set up monitoring and logging (Winston/Morgan)
- [ ] Configure environment variables for production
- [ ] Set up SSL certificates and HTTPS
- [ ] Add input validation and sanitization
- [ ] Implement proper error logging and monitoring

## 📝 Recent Updates

### v2.0.0 - Real-time Call Progress & Authentication
- ✅ Added user authentication system with JWT tokens
- ✅ Implemented real-time call progress tracking with phase visualization
- ✅ Added smart confirmation code extraction from Vapi transcripts
- ✅ Enhanced UI with user email display and logout functionality
- ✅ Added debug information for call data verification
- ✅ Improved error handling and fallback systems
- ✅ Added refund amount extraction from call transcripts

### v1.0.0 - Initial Release
- ✅ Basic AI negotiation system
- ✅ Vapi integration for voice calls
- ✅ Multiple request types (returns, cancellations, appointments)
- ✅ Mock confirmation code system