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
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate session ID on component mount
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [sessionId]);

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

  const sendMessageToAPI = async (message) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/chat', {
        message: message,
        sessionId: sessionId
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      return "I apologize, but I'm having trouble connecting to the server right now. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelection = async (selection) => {
    if (selection.link) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: selection.query
    };

    setMessages([...messages, newMessage]);
    setShowQuickSelections(false);
    
    // Get AI response from backend
    const aiResponse = await sendMessageToAPI(selection.query);
    
    const agentResponse = {
      id: messages.length + 2,
      sender: 'agent',
      name: 'Emily',
      role: 'AI Agent',
      content: aiResponse
    };
    setMessages(prev => [...prev, agentResponse]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-purple-600 text-lg font-semibold">E</span>
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
                  <div className="font-medium text-purple-600 mb-1">
                    {message.name}
                  </div>
                )}
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
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
              disabled={isLoading}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-purple-500 text-white rounded-full px-6 py-2 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
              <FontAwesomeIcon icon={faPaperPlane} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 