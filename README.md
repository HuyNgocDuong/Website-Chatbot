# UrbanHaven Real Estate Chatbot

An intelligent AI-powered chatbot that helps real estate customers with property questions and collects leads for the marketing team.

## Features

- 🤖 **AI-Powered Conversations**: Powered by OpenAI GPT-3.5 for natural, contextual responses
- 🏠 **Real Estate Knowledge**: Specialized knowledge about properties, pricing, and locations
- 📊 **Lead Collection**: Automated lead capture with detailed customer information
- 💬 **Session Management**: Persistent chat sessions for better conversation flow
- 📧 **Email Notifications**: Automatic lead notifications to your team
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- React 19
- Tailwind CSS
- Axios for API calls
- FontAwesome icons

### Backend
- Node.js with Express
- MongoDB for data storage
- OpenAI API for AI responses
- Nodemailer for email notifications

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenAI API key

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Website-Chatbot
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd chatbot-project/server
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/realestate-chatbot

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
ADMIN_EMAIL=admin@urbanhaven.com

# Security
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup

In a new terminal, navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Chat
- `POST /api/chat` - Send a message and get AI response
- `GET /api/health` - Health check endpoint

### Leads
- `POST /api/leads` - Submit a new lead
- `GET /api/leads` - Get all leads (admin)

### Properties
- `GET /api/properties` - Get property information

## Configuration

### OpenAI API
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Get your API key from the dashboard
3. Add it to your `.env` file

### MongoDB
You can use either:
- **Local MongoDB**: Install and run locally
- **MongoDB Atlas**: Cloud database service

### Email Notifications (Optional)
1. Use Gmail with App Password
2. Enable 2-factor authentication
3. Generate an App Password
4. Add credentials to `.env`

## Project Structure

```
Website-Chatbot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.js
│   │   │   └── LeadForm.js
│   │   └── App.js
│   └── package.json
├── chatbot-project/
│   └── server/            # Node.js backend
│       ├── server.js
│       ├── package.json
│       └── env.example
└── README.md
```

## Customization

### Adding New Property Types
Edit the `realEstateKnowledge` object in `server.js`:

```javascript
const realEstateKnowledge = {
  pricing: {
    // Add new property types here
    newType: "Description and pricing..."
  }
};
```

### Modifying AI Personality
Update the `systemPrompt` in the `generateAIResponse` function:

```javascript
const systemPrompt = `You are Emily, an AI real estate agent...`;
```

### Styling Changes
The frontend uses Tailwind CSS. Modify classes in the React components to change the appearance.

## Deployment

### Backend Deployment
1. Set up a cloud server (AWS, DigitalOcean, Heroku)
2. Install Node.js and MongoDB
3. Set environment variables
4. Use PM2 or similar for process management

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or similar
3. Update API endpoints to production URLs

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`

**OpenAI API Errors**
- Verify API key is correct
- Check API usage limits

**CORS Errors**
- Ensure backend is running on correct port
- Check proxy configuration in `client/package.json`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the repository or contact the development team.
