// =========================
// Imports & Configuration
// =========================
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
require('dotenv').config();

// =========================
// App Initialization
// =========================
const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// Middleware
// =========================
app.use(cors());
app.use(express.json());

// =========================
// MongoDB Connection
// =========================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate-chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// =========================
// OpenAI Configuration
// =========================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

// =========================
// Database Models
// =========================
// Lead schema for storing contact/lead info
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

// Chat session schema for storing chat history and context
const chatSessionSchema = new mongoose.Schema({
  sessionId: String,
  messages: [{
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    intent: String,
    confidence: Number
  }],
  currentState: { type: String, default: 'greeting' },
  userInfo: {
    name: String,
    email: String,
    phone: String,
    propertyInterest: String,
    budget: String,
    location: String,
    urgency: String,
    timeline: String
  },
  conversationContext: {
    lastIntent: String,
    mentionedTopics: [String],
    leadScore: { type: Number, default: 0 },
    qualified: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

// =========================
// Real Estate Knowledge Base
// =========================
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

// =========================
// Intent Recognition & Conversation State
// =========================
const intentPatterns = {
  pricing: ['price', 'cost', 'how much', 'budget', 'afford', 'expensive', 'cheap'],
  location: ['where', 'location', 'area', 'neighborhood', 'district', 'downtown', 'suburban'],
  property_type: ['apartment', 'house', 'condo', 'villa', 'luxury', 'commercial'],
  services: ['service', 'help', 'assist', 'tour', 'financing', 'legal', 'management'],
  contact: ['contact', 'speak', 'talk', 'agent', 'human', 'call', 'phone'],
  appointment: ['schedule', 'book', 'appointment', 'meeting', 'visit', 'tour'],
  lead_qualification: ['interested', 'buy', 'purchase', 'looking for', 'want to']
};
const conversationStates = {
  GREETING: 'greeting',
  GATHERING_INFO: 'gathering_info',
  QUALIFYING_LEAD: 'qualifying_lead',
  PROVIDING_INFO: 'providing_info',
  SCHEDULING: 'scheduling',
  COLLECTING_CONTACT: 'collecting_contact',
  FOLLOW_UP: 'follow_up'
};

// =========================
// Utility Functions
// =========================
// Intent recognition
function recognizeIntent(message) {
  const lowerMessage = message.toLowerCase();
  let bestIntent = 'general';
  let highestConfidence = 0;

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const matches = patterns.filter(pattern => lowerMessage.includes(pattern));
    const confidence = matches.length / patterns.length;
    
    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestIntent = intent;
    }
  }

  return { intent: bestIntent, confidence: highestConfidence };
}

// Contextual response generation
function generateContextualResponse(intent, userInfo, conversationContext, currentState) {
  const responses = {
    pricing: {
      general: "I'd be happy to help you understand our pricing! We have properties across different price ranges. What type of property are you interested in - apartments, houses, or luxury properties?",
      with_budget: `Based on your budget of ${userInfo.budget}, I can recommend some great options. Would you like to hear about specific properties in that range?`,
      with_property: `Great choice! ${userInfo.propertyInterest}s typically range from ${getPriceRange(userInfo.propertyInterest)}. Would you like to schedule a viewing?`
    },
    location: {
      general: "We have properties in several great locations! We offer Downtown District for urban living, Suburban Heights for families, Waterfront Properties for luxury, and Mountain View Estates for scenic views. Which area interests you most?",
      with_location: `${userInfo.location} is an excellent choice! We have several properties available there. What's your budget range?`
    },
    contact: {
      general: "I'd be happy to connect you with one of our expert agents! To better assist you, could you tell me a bit about what you're looking for?",
      qualified: "Perfect! I can see you're seriously interested. Let me collect your contact information so our agent can reach out to you personally."
    },
    appointment: {
      general: "I'd love to schedule a property viewing for you! What type of property are you interested in seeing?",
      with_info: `Great! I have your preferences for ${userInfo.propertyInterest} in ${userInfo.location}. When would you like to schedule a viewing?`
    }
  };

  return responses[intent]?.[currentState] || responses[intent]?.general || "I'd be happy to help you with that! Could you tell me more about what you're looking for?";
}

// Helper for price ranges
function getPriceRange(propertyType) {
  const ranges = {
    apartment: "$150,000 - $400,000",
    house: "$250,000 - $800,000", 
    luxury: "$500,000 - $2,000,000+"
  };
  return ranges[propertyType] || "$150,000 - $2,000,000+";
}

// Lead scoring
function updateLeadScore(conversationContext, intent, userInfo) {
  let score = conversationContext.leadScore || 0;
  
  // Increase score based on intent
  if (intent === 'lead_qualification') score += 20;
  if (intent === 'appointment') score += 15;
  if (intent === 'contact') score += 10;
  
  // Increase score based on user info completeness
  if (userInfo.propertyInterest) score += 10;
  if (userInfo.budget) score += 10;
  if (userInfo.location) score += 10;
  if (userInfo.timeline) score += 15;
  
  // Mark as qualified if score is high enough
  const qualified = score >= 50;
  
  return { score, qualified };
}

// AI response handler
async function generateAIResponse(userMessage, conversationHistory = [], chatSession) {
  try {
    // Recognize user intent
    const { intent, confidence } = recognizeIntent(userMessage);
    
    // Update conversation context
    const updatedContext = updateLeadScore(chatSession.conversationContext, intent, chatSession.userInfo);
    
    // Determine conversation state
    let newState = chatSession.currentState;
    if (intent === 'lead_qualification' && !chatSession.userInfo.propertyInterest) {
      newState = conversationStates.GATHERING_INFO;
    } else if (updatedContext.qualified && !chatSession.userInfo.email) {
      newState = conversationStates.COLLECTING_CONTACT;
    } else if (intent === 'appointment') {
      newState = conversationStates.SCHEDULING;
    }

    // Generate contextual system prompt
    const systemPrompt = `You are Emily, an AI real estate agent for UrbanHaven. You help customers with property questions and collect leads for the marketing team. Be friendly, professional, and knowledgeable about real estate.

Current conversation state: ${newState}
User intent: ${intent} (confidence: ${confidence.toFixed(2)})
Lead score: ${updatedContext.score}/100
User info: ${JSON.stringify(chatSession.userInfo)}

Key information about UrbanHaven:
- Property types: Apartments ($150k-$400k), Houses ($250k-$800k), Luxury ($500k-$2M+)
- Services: Property tours, financing, legal consultation, property management
- Locations: Downtown, Suburban Heights, Waterfront, Mountain View Estates

Conversation Guidelines:
1. If user shows interest in properties, ask for their contact information
2. If user asks about pricing, provide specific ranges and ask about their budget
3. If user asks about locations, describe the areas and ask about their preferences
4. If user wants to schedule a viewing, collect necessary details
5. Be conversational and ask follow-up questions to gather more information
6. When lead score reaches 50+, politely ask for contact information

Current user preferences: ${chatSession.userInfo.propertyInterest ? `Property: ${chatSession.userInfo.propertyInterest}` : 'Not specified'} ${chatSession.userInfo.budget ? `Budget: ${chatSession.userInfo.budget}` : ''} ${chatSession.userInfo.location ? `Location: ${chatSession.userInfo.location}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    return {
      response: completion.choices[0].message.content,
      intent: intent,
      confidence: confidence,
      newState: newState,
      leadScore: updatedContext.score,
      qualified: updatedContext.qualified
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team.",
      intent: 'error',
      confidence: 0,
      newState: chatSession.currentState,
      leadScore: chatSession.conversationContext.leadScore,
      qualified: false
    };
  }
}

// =========================
// API Endpoints
// =========================

// --- Health Check ---
// Simple endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot server is running' });
});

// --- Chat Endpoint ---
// Handles chat messages, manages session, intent, and AI response
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat session
    let chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      chatSession = new ChatSession({ 
        sessionId,
        currentState: conversationStates.GREETING,
        conversationContext: {
          leadScore: 0,
          qualified: false,
          mentionedTopics: []
        }
      });
    }

    // Extract user information from message (simple pattern matching)
    const userInfo = { ...chatSession.userInfo };
    
    // Extract property interest
    const propertyPatterns = {
      apartment: /apartment|condo|flat/i,
      house: /house|home|single.?family/i,
      luxury: /luxury|villa|mansion|premium/i,
      commercial: /commercial|office|retail/i
    };
    
    for (const [type, pattern] of Object.entries(propertyPatterns)) {
      if (pattern.test(message) && !userInfo.propertyInterest) {
        userInfo.propertyInterest = type;
        break;
      }
    }
    
    // Extract budget
    const budgetMatch = message.match(/\$?(\d+(?:,\d{3})*(?:k|m)?)/i);
    if (budgetMatch && !userInfo.budget) {
      userInfo.budget = budgetMatch[0];
    }
    
    // Extract location
    const locationPatterns = {
      downtown: /downtown|city|urban/i,
      suburban: /suburban|suburb|family/i,
      waterfront: /waterfront|beach|lake/i,
      mountain: /mountain|scenic|view/i
    };
    
    for (const [location, pattern] of Object.entries(locationPatterns)) {
      if (pattern.test(message) && !userInfo.location) {
        userInfo.location = location;
        break;
      }
    }
    
    // Extract timeline
    const timelinePatterns = {
      urgent: /urgent|asap|soon|immediately/i,
      '3-6 months': /3.?6.?month|quarter|few.?month/i,
      '6-12 months': /6.?12.?month|half.?year|year/i,
      '1+ years': /year.?plus|long.?term|future/i
    };
    
    for (const [timeline, pattern] of Object.entries(timelinePatterns)) {
      if (pattern.test(message) && !userInfo.timeline) {
        userInfo.timeline = timeline;
        break;
      }
    }

    // Update chat session with extracted info
    chatSession.userInfo = userInfo;

    // Add user message to session with intent recognition
    const { intent, confidence } = recognizeIntent(message);
    chatSession.messages.push({
      sender: 'user',
      content: message,
      intent: intent,
      confidence: confidence
    });

    // Generate AI response with enhanced context
    const conversationHistory = chatSession.messages.slice(-10); // Last 10 messages for context
    const aiResponse = await generateAIResponse(message, conversationHistory, chatSession);

    // Update chat session state and context
    chatSession.currentState = aiResponse.newState;
    chatSession.conversationContext.leadScore = aiResponse.leadScore;
    chatSession.conversationContext.qualified = aiResponse.qualified;
    chatSession.conversationContext.lastIntent = aiResponse.intent;

    // Add AI response to session
    chatSession.messages.push({
      sender: 'agent',
      content: aiResponse.response,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence
    });

    await chatSession.save();

    res.json({
      response: aiResponse.response,
      sessionId: chatSession.sessionId,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence,
      newState: aiResponse.newState,
      leadScore: aiResponse.leadScore,
      qualified: aiResponse.qualified,
      userInfo: chatSession.userInfo
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Lead Collection Endpoint ---
// Receives lead/contact form submissions and stores in MongoDB
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, propertyInterest, budget, location, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const lead = new Lead({ name, email, phone, propertyInterest, budget, location, message });
    await lead.save();
    // Optionally send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendLeadNotification(lead);
    }
    res.json({ success: true, message: 'Lead submitted successfully', leadId: lead._id });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});

// --- Get Leads (Admin) ---
// Returns all leads for admin dashboard
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// --- Analytics Endpoint ---
// Returns conversation and lead analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const totalSessions = await ChatSession.countDocuments();
    const qualifiedLeads = await ChatSession.countDocuments({ 'conversationContext.qualified': true });
    const avgLeadScore = await ChatSession.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$conversationContext.leadScore' } } }
    ]);
    
    // Get most common intents
    const intentStats = await ChatSession.aggregate([
      { $unwind: '$messages' },
      { $group: { _id: '$messages.intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      totalSessions,
      qualifiedLeads,
      avgLeadScore: avgLeadScore[0]?.avgScore || 0,
      topIntents: intentStats,
      conversionRate: totalSessions > 0 ? (qualifiedLeads / totalSessions * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// --- Get Session Details ---
// Returns details for a specific chat session
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// --- Property Info Endpoint ---
// Returns static property/knowledge base info
app.get('/api/properties', (req, res) => {
  res.json(realEstateKnowledge);
});

// =========================
// Email Notification Utility
// =========================
// Sends email to admin when a new lead is submitted
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

// =========================
// Error Handling Middleware
// =========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// =========================
// Server Startup
// =========================
app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
