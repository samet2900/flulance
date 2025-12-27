import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatBox = ({ match, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [match.match_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matches/${match.match_id}/messages`, {
        withCredentials: true
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/matches/${match.match_id}/messages`,
        { message: newMessage },
        { withCredentials: true }
      );
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const otherUserName = currentUser.user_type === 'marka' ? match.influencer_name : match.brand_name;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-2xl w-full max-w-3xl h-[600px] flex flex-col border border-white/20" 
        onClick={(e) => e.stopPropagation()}
        data-testid="chatbox"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">{match.job_title}</h2>
            <p className="text-gray-400">Sohbet: {otherUserName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="close-chat-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Henüz mesaj yok. Sohbeti başlatın!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${msg.sender_user_id === currentUser.user_id ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.message_id}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.sender_user_id === currentUser.user_id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-white/10'
                  }`}
                >
                  <p className="text-xs text-gray-300 mb-1">{msg.sender_name}</p>
                  <p className="text-white">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              disabled={loading}
              data-testid="message-input"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5" />
              Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;