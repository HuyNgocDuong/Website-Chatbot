const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate-chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB Models
const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  propertyInterest: String,
  budget: String,
  location: String,
  message: String,
  source: { type: String, default: 'chatbot' },
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

const chatSessionSchema = new mongoose.Schema({
  sessionId: String,
  messages: [{
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

// Real estate knowledge base
const realEstateKnowledge = {
  pricing: {
    apartments: "Our apartments range from $150,000 to $400,000 depending on location and amenities.",
    houses: "Single-family homes start from $250,000 and can go up to $800,000 for premium properties.",
    luxury: "Luxury properties and villas range from $500,000 to $2,000,000+ with premium features."
  },
  locations: [
    "Downtown District - Urban living with city amenities",
    "Suburban Heights - Family-friendly neighborhoods",
    "Waterfront Properties - Exclusive beach and lake access",
    "Mountain View Estates - Scenic mountain properties"
  ],
  services: [
    "Property tours (virtual and in-person)",
    "Financing assistance and mortgage pre-approval",
    "Legal consultation and closing services",
    "Property management for investors",
    "24/7 customer support"
  ]
};

// AI Chat Handler
async function generateAIResponse(userMessage, conversationHistory = []) {
  try {
    const systemPrompt = `You are Emily, an AI real estate agent for UrbanHaven. You help customers with property questions and collect leads for the marketing team. Be friendly, professional, and knowledgeable about real estate.

Key information about UrbanHaven:
- Property types: Apartments ($150k-$400k), Houses ($250k-$800k), Luxury ($500k-$2M+)
- Services: Property tours, financing, legal consultation, property management
- Locations: Downtown, Suburban Heights, Waterfront, Mountain View Estates

When customers show interest in properties, ask for their contact information to connect them with a human agent.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team.";
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot server is running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat session
    let chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      chatSession = new ChatSession({ sessionId });
    }

    // Add user message to session
    chatSession.messages.push({
      sender: 'user',
      content: message
    });

    // Generate AI response
    const conversationHistory = chatSession.messages.slice(-10); // Last 10 messages for context
    const aiResponse = await generateAIResponse(message, conversationHistory);

    // Add AI response to session
    chatSession.messages.push({
      sender: 'agent',
      content: aiResponse
    });

    await chatSession.save();

    res.json({
      response: aiResponse,
      sessionId: chatSession.sessionId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lead collection endpoint
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, propertyInterest, budget, location, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const lead = new Lead({
      name,
      email,
      phone,
      propertyInterest,
      budget,
      location,
      message
    });

    await lead.save();

    // Send email notification (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendLeadNotification(lead);
    }

    res.json({ 
      success: true, 
      message: 'Lead submitted successfully',
      leadId: lead._id 
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});

// Get leads (for admin purposes)
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Property information endpoint
app.get('/api/properties', (req, res) => {
  res.json(realEstateKnowledge);
});

// Email notification function
async function sendLeadNotification(lead) {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'New Lead from Chatbot',
      html: `
        <h2>New Lead Generated</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
        <p><strong>Property Interest:</strong> ${lead.propertyInterest || 'Not specified'}</p>
        <p><strong>Budget:</strong> ${lead.budget || 'Not specified'}</p>
        <p><strong>Location:</strong> ${lead.location || 'Not specified'}</p>
        <p><strong>Message:</strong> ${lead.message || 'No additional message'}</p>
        <p><strong>Date:</strong> ${lead.createdAt}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Lead notification email sent');
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
