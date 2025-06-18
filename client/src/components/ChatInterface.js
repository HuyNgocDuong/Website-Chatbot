import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faNewspaper,
  faMoneyBill,
  faCircleInfo,
  faPhone,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

const QuickSelectionBox = ({ icon, text, onClick, iconColor, link }) => (
  <button
    onClick={link ? () => window.open(link, '_blank') : onClick}
    className="px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm text-gray-700 flex items-center gap-2"
  >
    <FontAwesomeIcon icon={icon} className={`${iconColor}`} />
    <span>{text}</span>
  </button>
);

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      name: 'Emily',
      role: 'AI Agent',
      content: 'Welcome to UrbanHaven! How can I help you today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickSelections, setShowQuickSelections] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickSelections = [
    {
      icon: faNewspaper,
      text: "Visit our news",
      query: "I'd like to read the latest news.",
      iconColor: "text-blue-500",
      link: "#" // Replace this with your actual news page URL later
    },
    {
      icon: faMoneyBill,
      text: "Pricing",
      query: "Can you tell me about the property prices?",
      iconColor: "text-green-500"
    },
    {
      icon: faCircleInfo,
      text: "About UrbanHaven",
      query: "I'd like to know more about UrbanHaven.",
      iconColor: "text-orange-500"
    },
    {
      icon: faPhone,
      text: "Contact Us",
      query: "I would like to speak with a real estate agent.",
      iconColor: "text-red-500"
    }
  ];

  const handleQuickSelection = (selection) => {
    if (selection.link) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: selection.query
    };

    setMessages([...messages, newMessage]);
    setShowQuickSelections(false);
    
    // Simulate agent response
    setTimeout(() => {
      let response = '';
      switch(selection.text) {
        case 'Visit our news':
          response = "I'll direct you to our news page where you can find the latest updates and information about UrbanHaven.";
          break;
        case 'Pricing':
          response = "I can help you with pricing information! Our properties range from:\n• Apartments: Starting from $150,000\n• Houses: Starting from $250,000\n• Luxury Villas: Starting from $500,000\n\nWould you like to know about specific properties or financing options?";
          break;
        case 'About UrbanHaven':
          response = "UrbanHaven is your premier real estate partner! We offer:\n• Extensive property portfolio\n• Expert real estate agents\n• Flexible financing options\n• Virtual property tours\n• 24/7 customer support\n\nWhat specific aspect would you like to know more about?";
          break;
        case 'Contact Us':
          response = "I'll help you get in touch with our team! Please provide:\n• Your preferred contact method (phone/email)\n• Best time to reach you\n• Type of property you're interested in\n• Any specific questions you have\n\nOur agents typically respond within 2 hours during business hours.";
          break;
        default:
          response = "How can I assist you further with your real estate needs?";
      }

      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        name: 'Emily',
        role: 'AI Agent',
        content: response
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setShowQuickSelections(false);
    
    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: messages.length + 2,
        sender: 'agent',
        name: 'Emily',
        role: 'AI Agent',
        content: "I understand. Let me help you with that. Could you please provide more specific details about what you're looking for?"
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg font-semibold">E</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Emily</h1>
              <p className="text-sm text-gray-500">AI Agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-sm rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.sender === 'agent' && (
                  <div className="font-medium text-blue-600 mb-1">
                    {message.name}
                  </div>
                )}
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          {showQuickSelections && (
            <div className="my-4">
              <div className="flex flex-wrap gap-2">
                {quickSelections.map((selection, index) => (
                  <QuickSelectionBox
                    key={index}
                    icon={selection.icon}
                    text={selection.text}
                    iconColor={selection.iconColor}
                    onClick={() => handleQuickSelection(selection)}
                    link={selection.link}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-full px-6 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <span>Send</span>
              <FontAwesomeIcon icon={faPaperPlane} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 