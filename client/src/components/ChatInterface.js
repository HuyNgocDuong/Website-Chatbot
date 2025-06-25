import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faNewspaper,
  faMoneyBill,
  faCircleInfo,
  faPhone,
  faPaperPlane,
  faBuilding,
  faUsers,
  faShieldAlt,
  faStar,
  faMapMarkerAlt,
  faHandshake
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import LeadForm from './LeadForm';

const QuickSelectionBox = ({ icon, text, onClick, iconColor, link }) => (
  <button
    onClick={link ? () => window.open(link, '_blank') : onClick}
    className="px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 text-sm text-gray-700 flex items-center gap-2 shadow-sm"
  >
    <FontAwesomeIcon icon={icon} className={`${iconColor}`} />
    <span>{text}</span>
  </button>
);

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickSelections, setShowQuickSelections] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [conversationState, setConversationState] = useState('greeting');
  const [leadScore, setLeadScore] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showSecondGreeting, setShowSecondGreeting] = useState(false);
  const [showGreetingLoader, setShowGreetingLoader] = useState(true);
  const [greetingStep, setGreetingStep] = useState(0); // 0: loader, 1: first greeting, 2: loader, 3: second greeting
  const [showAboutSubsections, setShowAboutSubsections] = useState(false);
  const [selectedAboutSection, setSelectedAboutSection] = useState(null);
  const messagesEndRef = useRef(null);
  const didRunGreeting = useRef(false);
  const [resetKey, setResetKey] = useState(0);
  const hasAnimatedGreeting = useRef(false);
  const [showTempLoader, setShowTempLoader] = useState(false);
  const [followUpOptions, setFollowUpOptions] = useState([]);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [leadFormType, setLeadFormType] = useState('');
  const [leadFormInitial, setLeadFormInitial] = useState({});
  const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);

  useEffect(() => {
    if (hasAnimatedGreeting.current) return;
    hasAnimatedGreeting.current = true;

    // 1. Show loader (typing) immediately
    setShowGreetingLoader(true);
    setGreetingStep(0);
    setTimeout(() => {
      // 2. Show first greeting
      setMessages([
        {
          id: 1,
          sender: 'agent',
          name: 'Emily',
          role: 'AI Agent',
          content: "Hello there! 👋 It's nice to meet you!"
        }
      ]);
      setShowGreetingLoader(false);
      setGreetingStep(1);
      // 3. Show loader again
      setTimeout(() => {
        setShowGreetingLoader(true);
        setGreetingStep(2);
        // 4. Show second greeting
        setTimeout(() => {
          setMessages(prev => ([
            ...prev,
            {
              id: 2,
              sender: 'agent',
              name: 'Emily',
              role: 'AI Agent',
              content: "What brings you here today? Please use the navigation below or ask me anything about UrbanHaven. ✨"
            }
          ]));
          setShowGreetingLoader(false);
          setGreetingStep(3);
          // 5. Show quick selections
          setTimeout(() => setShowQuickSelections(true), 400);
        }, 1200);
      }, 800);
    }, 1000);
    // eslint-disable-next-line
  }, [resetKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show lead form when user is qualified, but only if not already submitted
  useEffect(() => {
    if (leadScore >= 50 && !userInfo.email && !showLeadForm && !leadFormSubmitted) {
      setShowLeadForm(true);
    }
  }, [leadScore, userInfo.email, showLeadForm, leadFormSubmitted]);

  const aboutSubsections = [
    {
      id: 'company',
      text: "🏢 Our Company",
      query: "Tell me about UrbanHaven company.",
      answer: "UrbanHaven is a leading real estate platform founded in 2020 with a mission to make property discovery and investment accessible to everyone. We've helped over 10,000 families find their dream homes and have a team of 50+ certified real estate professionals across major cities."
    },
    {
      id: 'services',
      text: "🛠️ Our Services",
      query: "What services does UrbanHaven offer?",
      answer: "We offer comprehensive real estate services including: • Property search and discovery • Virtual and in-person tours • Mortgage consultation and pre-approval • Investment property analysis • Legal assistance and documentation • Property management services • Market insights and reports"
    },
    {
      id: 'locations',
      text: "📍 Our Locations",
      query: "Where does UrbanHaven operate?",
      answer: "UrbanHaven operates in 15+ major cities including New York, Los Angeles, Chicago, Miami, Seattle, Austin, Denver, and more. We're expanding rapidly and plan to cover 25+ cities by 2025. Each location has local experts who understand the unique market dynamics."
    },
    {
      id: 'team',
      text: "👥 Our Team",
      query: "Tell me about UrbanHaven's team.",
      answer: "Our team consists of certified real estate professionals, market analysts, mortgage specialists, and customer success experts. Each team member undergoes rigorous training and maintains the highest ethical standards. We pride ourselves on personalized service and deep market knowledge."
    },
    {
      id: 'values',
      text: "💎 Our Values",
      query: "What are UrbanHaven's core values?",
      answer: "Our core values are: • Transparency - Clear pricing and honest communication • Excellence - Highest quality service standards • Innovation - Using technology to improve the experience • Trust - Building long-term relationships • Community - Supporting local neighborhoods and growth"
    },
    {
      id: 'awards',
      text: "🏆 Awards & Recognition",
      query: "What awards has UrbanHaven received?",
      answer: "UrbanHaven has been recognized with: • Best Real Estate Platform 2023 (Real Estate Weekly) • Top 10 Startups to Watch (TechCrunch) • Customer Choice Award 2022 (Better Business Bureau) • Innovation in Real Estate Technology (National Association of Realtors)"
    }
  ];

  const quickSelections = [
    {
      text: "🏢 About UrbanHaven",
      query: "Tell me about UrbanHaven.",
      answer: "UrbanHaven is a modern real estate platform offering apartments, houses, and luxury properties in top locations. We provide tours, financing, and expert support for your property journey.",
      hasSubsections: true
    },
    {
      text: "🤖 Using Chatbot",
      query: "How do I use the chatbot?",
      answer: "Welcome! I'm here to help you with any questions you have about real estate, whether it's about properties, locations, pricing, or services we offer. Just ask away! If you're looking for something specific, let me know, and I'll do my best to assist you. What are you curious about today?"
    },
    {
      text: "🤔 I have questions",
      query: "I have some questions.",
      answer: "Of course! Please type your questions below and I'll do my best to help you with anything related to UrbanHaven or real estate."
    },
    {
      text: "👀 Just browsing",
      query: "I'm just browsing.",
      answer: "No problem! Feel free to look around and ask me anything if you get curious. I'm here to help whenever you need."
    }
  ];

  const followUpSelections = {
    'using_chatbot': [
      { text: '📝 How to ask questions', answer: 'Just type your question in the chat box and I will do my best to help you!' },
      { text: '💡 What can you do?', answer: 'I can answer questions about our products, services, pricing, and more. Try asking me anything!' },
      { text: '🔄 Reset conversation', answer: 'You can reset the conversation anytime by clicking the Clear Chat button above.' }
    ],
    'i_have_questions': [
      { text: '🏠 Property info', answer: 'I can provide details about properties, locations, and features. What type of property are you interested in?' },
      { text: '💰 Financing', answer: 'We offer various financing options. Would you like to know about mortgage rates or pre-approval?' },
      { text: '📅 Schedule a tour', answer: 'I can help you schedule a tour. Please let me know your preferred date and property.' },
      { text: '🧑‍💼 Talk to an agent', answer: 'I can connect you with a real estate agent. Please provide your contact details.' }
    ]
  };

  const sendMessageToAPI = async (message) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/chat', {
        message: message,
        sessionId: sessionId
      });
      
      // Update conversation state and lead score
      if (response.data.newState) {
        setConversationState(response.data.newState);
      }
      if (response.data.leadScore !== undefined) {
        setLeadScore(response.data.leadScore);
      }
      if (response.data.userInfo) {
        setUserInfo(response.data.userInfo);
      }
      
      return response.data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      return "I apologize, but I'm having trouble connecting to the server right now. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelection = (selection) => {
    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: selection.query
    };
    setMessages([...messages, newMessage]);
    setShowQuickSelections(false);

    // If it's the about section with subsections, show them
    if (selection.hasSubsections) {
      setShowAboutSubsections(true);
      return;
    }

    // Show the dot loader, then the fixed answer
    setShowTempLoader(true);
    setTimeout(() => {
      setShowTempLoader(false);
      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        name: 'Emily',
        role: 'AI Agent',
        content: selection.answer
      };
      setMessages(prev => [...prev, agentResponse]);

      // Show follow-up options if relevant
      if (selection.text.includes('Using Chatbot')) {
        setFollowUpOptions(followUpSelections['using_chatbot']);
        setShowFollowUp(true);
      } else if (selection.text.includes('I have questions')) {
        setFollowUpOptions(followUpSelections['i_have_questions']);
        setShowFollowUp(true);
      } else {
        setShowFollowUp(false);
      }
    }, 700);
  };

  const handleAboutSubsection = (subsection) => {
    setSelectedAboutSection(subsection.id);
    // Add user message
    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: subsection.query
    };
    setMessages(prev => [...prev, newMessage]);
    setShowTempLoader(true);
    // Add agent response with animation delay
    setTimeout(() => {
      setShowTempLoader(false);
      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        name: 'Emily',
        role: 'AI Agent',
        content: subsection.answer
      };
      setMessages(prev => [...prev, agentResponse]);
      setShowAboutSubsections(false);
      setSelectedAboutSection(null);
    }, 700);
  };

  const handleFollowUp = (option) => {
    if (option.text.includes('Schedule a tour')) {
      setLeadFormType('schedule');
      setLeadFormInitial({ message: 'I would like to schedule a tour.' });
      setShowFollowUp(false);
      setShowLeadForm(true);
      return;
    }
    if (option.text.includes('Talk to an agent')) {
      setLeadFormType('agent');
      setLeadFormInitial({ message: 'I would like to talk to an agent.' });
      setShowFollowUp(false);
      setShowLeadForm(true);
      return;
    }
    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: option.text
    };
    setMessages(prev => [...prev, newMessage]);
    setShowFollowUp(false);
    setShowTempLoader(true);
    setTimeout(() => {
      setShowTempLoader(false);
      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        name: 'Emily',
        role: 'AI Agent',
        content: option.answer
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 700);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Close the form if open
    if (showLeadForm) {
      setShowLeadForm(false);
      setLeadFormType('');
      setLeadFormInitial({});
    }

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setShowQuickSelections(false);
    
    // Get AI response from backend
    const aiResponse = await sendMessageToAPI(inputMessage);
    
    const agentResponse = {
      id: messages.length + 2,
      sender: 'agent',
      name: 'Emily',
      role: 'AI Agent',
      content: aiResponse
    };
    setMessages(prev => [...prev, agentResponse]);
  };

  const handleLeadFormSuccess = (message) => {
    setLeadFormSubmitted(true);
    // Add a success message to the chat
    const successMessage = {
      id: messages.length + 1,
      sender: 'agent',
      name: 'Emily',
      role: 'AI Agent',
      content: leadFormType === 'schedule'
        ? "Thank you! Your tour request has been received. Our team will contact you soon to confirm the details."
        : leadFormType === 'agent'
          ? "Thank you! An agent will reach out to you shortly. If you have more questions, feel free to ask!"
          : "Perfect! I've received your information. One of our expert agents will contact you within 24 hours. Is there anything else I can help you with today?"
    };
    setMessages(prev => [...prev, successMessage]);
    setShowLeadForm(false);
    setLeadFormType('');
    setLeadFormInitial({});
  };

  // Get conversation state display text
  const getStateDisplay = () => {
    const states = {
      greeting: 'Getting to know you',
      gathering_info: 'Learning your preferences',
      qualifying_lead: 'Understanding your needs',
      providing_info: 'Sharing information',
      scheduling: 'Scheduling assistance',
      collecting_contact: 'Getting your details',
      follow_up: 'Following up'
    };
    return states[conversationState] || 'Conversation';
  };

  // Helper to reset chat to initial animated greeting flow
  const resetChat = () => {
    setMessages([]);
    setShowQuickSelections(false);
    setShowGreetingLoader(true);
    setGreetingStep(0);
    setShowAboutSubsections(false);
    setSelectedAboutSection(null);
    setShowFollowUp(false);
    setFollowUpOptions([]);
    setLeadFormSubmitted(false);
    hasAnimatedGreeting.current = false;
    setResetKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-purple-600 text-lg font-semibold">E</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Emily</h1>
              <p className="text-sm text-gray-500">AI Agent</p>
            </div>
          </div>
          <button
            onClick={resetChat}
            className="px-4 py-1 rounded-full border border-gray-300 bg-white hover:bg-red-50 text-red-600 text-sm font-medium ml-4 shadow-sm transition-colors"
            title="Clear chat"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, idx) => (
            <React.Fragment key={message.id}>
              <div
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm rounded-2xl p-4 ${
                    message.sender === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.sender === 'agent' && (
                    <div className="font-medium text-purple-600 mb-1">
                      {message.name}
                    </div>
                  )}
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
              {/* Show quick selections right after the second greeting bubble */}
              {showQuickSelections && greetingStep === 3 && idx === messages.length - 1 && (
                <div className="flex flex-wrap gap-3 justify-center mt-6 mb-2">
                  {quickSelections.map((selection, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSelection(selection)}
                      className="px-5 py-2 rounded-full border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 transform hover:scale-105 text-base text-gray-700 flex items-center gap-2 shadow-sm"
                    >
                      {selection.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Show about subsections */}
              {showAboutSubsections && idx === messages.length - 1 && (
                <div className="mt-6 mb-2">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 text-sm mb-3">What would you like to know about UrbanHaven?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {aboutSubsections.map((subsection, index) => (
                      <button
                        key={subsection.id}
                        onClick={() => handleAboutSubsection(subsection)}
                        disabled={selectedAboutSection === subsection.id}
                        className={`px-4 py-3 rounded-lg border transition-all duration-300 transform hover:scale-105 text-sm text-left ${
                          selectedAboutSection === subsection.id
                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                        } shadow-sm`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{subsection.text.split(' ')[0]}</span>
                          <span className="font-medium">{subsection.text.split(' ').slice(1).join(' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show follow-up options */}
              {showFollowUp && idx === messages.length - 1 && followUpOptions.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-4 mb-2">
                  {followUpOptions.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleFollowUp(option)}
                      className="px-5 py-2 rounded-full border-2 border-purple-400 bg-white hover:bg-purple-50 transition-all duration-300 text-base text-gray-700 flex items-center gap-2 shadow-sm font-medium"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Inline LeadForm as a chat bubble if showLeadForm is true and this is the last message */}
              {showLeadForm && idx === messages.length - 1 && (
                <div className="flex justify-start">
                  <div className="max-w-sm">
                    <LeadForm
                      onClose={() => { setShowLeadForm(false); setLeadFormType(''); setLeadFormInitial({}); }}
                      onSuccess={handleLeadFormSuccess}
                      initialData={leadFormInitial}
                      title={leadFormType === 'schedule' ? 'Schedule a Tour' : leadFormType === 'agent' ? 'Talk to an Agent' : undefined}
                      variant="inline"
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          {/* Greeting loading animation (between greetings) */}
          {(showGreetingLoader || showTempLoader) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 max-w-sm rounded-2xl p-4">
                <div className="font-medium text-purple-600 mb-1">Emily</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 max-w-sm rounded-2xl p-4">
                <div className="font-medium text-purple-600 mb-1">Emily</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 