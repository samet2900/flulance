import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, Paperclip, Image, File, Video, Download, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatBox = ({ match, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert('Dosya boyutu çok büyük. Maksimum 50MB yükleyebilirsiniz.');
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    setUploading(!!selectedFile);

    try {
      if (selectedFile) {
        // Send with attachment
        const formData = new FormData();
        formData.append('message', newMessage);
        formData.append('file', selectedFile);

        await axios.post(
          `${API_URL}/api/matches/${match.match_id}/messages/with-attachment`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      } else {
        // Send text only
        await axios.post(
          `${API_URL}/api/matches/${match.match_id}/messages`,
          { message: newMessage },
          { withCredentials: true }
        );
      }
      
      setNewMessage('');
      clearSelectedFile();
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Mesaj gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'image') return <Image className="w-5 h-5" />;
    if (fileType === 'video') return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFileTypeLabel = (fileType) => {
    if (fileType === 'image') return 'Resim';
    if (fileType === 'video') return 'Video';
    return 'Dosya';
  };

  const renderAttachment = (attachment, isMine) => {
    if (!attachment) return null;

    const fullUrl = attachment.url.startsWith('http') 
      ? attachment.url 
      : `${API_URL}${attachment.url}`;

    if (attachment.file_type === 'image') {
      return (
        <div className="mt-2">
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={fullUrl} 
              alt={attachment.original_filename}
              className="max-w-[250px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Image className="w-3 h-3" />
            {attachment.original_filename}
          </p>
        </div>
      );
    }

    if (attachment.file_type === 'video') {
      return (
        <div className="mt-2">
          <video 
            src={fullUrl} 
            controls 
            className="max-w-[300px] max-h-[200px] rounded-lg"
          />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Video className="w-3 h-3" />
            {attachment.original_filename}
          </p>
        </div>
      );
    }

    // Document
    return (
      <a 
        href={fullUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-900/50 hover:bg-white/20'
        }`}
      >
        <File className="w-5 h-5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.original_filename}</p>
          <p className="text-xs text-gray-400">
            {(attachment.file_size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Download className="w-4 h-4" />
      </a>
    );
  };

  const otherUserName = currentUser.user_type === 'marka' ? match.influencer_name : match.brand_name;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-2xl w-full max-w-3xl h-[600px] flex flex-col border border-gray-800" 
        onClick={(e) => e.stopPropagation()}
        data-testid="chatbox"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">{match.job_title}</h2>
            <p className="text-gray-400">Sohbet: {otherUserName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900/50 rounded-lg transition-colors"
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
              <p className="text-sm text-gray-500 mt-2">Resim, video ve dosya paylaşabilirsiniz</p>
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
                      ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                      : 'bg-gray-900/50'
                  }`}
                >
                  <p className="text-xs text-gray-300 mb-1">{msg.sender_name}</p>
                  {msg.message && <p className="text-white">{msg.message}</p>}
                  {renderAttachment(msg.attachment, msg.sender_user_id === currentUser.user_id)}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {msg.sender_user_id === currentUser.user_id && (
                      <span className={`text-xs ${msg.is_read ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {msg.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="px-6 py-3 border-t border-gray-700 bg-black/50">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-gray-900/50 rounded-lg flex items-center justify-center">
                  {getFileIcon(selectedFile.type.split('/')[0])}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {getFileTypeLabel(selectedFile.type.split('/')[0])}
                </p>
              </div>
              <button
                onClick={clearSelectedFile}
                className="p-2 hover:bg-gray-900/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx"
              data-testid="file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
              disabled={loading}
              data-testid="attach-file-btn"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
              disabled={loading}
              data-testid="message-input"
            />
            <button
              type="submit"
              disabled={loading || (!newMessage.trim() && !selectedFile)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              data-testid="send-message-btn"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Gönder
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Resim, video (max 50MB) ve PDF dosyaları paylaşabilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
