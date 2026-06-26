import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ArrowLeft, Loader2 } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';

const ChatWidget = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    isOpen,
    setIsOpen,
    activeConversationId,
    setActiveConversationId,
    activeStoreId,
    activeStoreName,
    conversations,
    messages,
    fetchConversations,
    sendMessage,
    openChatWithStore
  } = useChatStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Only render for CUSTOMER role (or guests, but they will be prompted to login)
  const isCustomer = !isAuthenticated || user?.role?.toUpperCase() === 'CUSTOMER';
  if (!isCustomer) return null;

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    const textToSend = text;
    setText('');
    
    const result = await sendMessage(textToSend);
    setLoading(false);
    
    if (!result.success) {
      alert(result.message || 'Gagal mengirim pesan');
      setText(textToSend); // Restore text
    }
  };

  const handleBack = () => {
    setActiveConversationId(null);
  };

  const currentChatName = activeConversationId
    ? conversations.find(c => c.id === activeConversationId)?.store?.name || 'Obrolan'
    : activeStoreName || 'Toko';

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              alert('Silakan login terlebih dahulu untuk memulai percakapan.');
              return;
            }
            setIsOpen(true);
          }}
          className="bg-primary hover:bg-green-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105"
          title="Tanya Toko (Chat)"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-border w-[360px] h-[480px] flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              {(activeConversationId || activeStoreId) && (
                <button onClick={handleBack} className="p-1 -ml-1 text-white hover:bg-white/10 rounded transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="font-bold text-sm truncate max-w-[200px]">
                {activeConversationId || activeStoreId ? currentChatName : '💬 Obrolan Toko'}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 p-1 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
            {!(activeConversationId || activeStoreId) ? (
              /* Conversations List view */
              <div className="divide-y divide-border p-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-24 text-sm px-4">
                    <p className="font-bold text-gray-700 mb-1">Belum ada obrolan</p>
                    <p className="text-xs text-gray-400">Klik tombol "Chat Toko" pada halaman detail toko untuk memulai obrolan baru.</p>
                  </div>
                ) : (
                  conversations.map(conv => {
                    const lastMsg = conv.messages?.[0]?.message || 'Mulai chat...';
                    const lastTime = conv.messages?.[0]?.createdAt
                      ? new Date(conv.messages[0].createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className="p-3 hover:bg-white cursor-pointer rounded-xl transition-colors flex justify-between gap-3 mb-1"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-text truncate">{conv.store?.name}</h4>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>
                        </div>
                        {lastTime && <span className="text-[10px] text-gray-400 font-medium shrink-0">{lastTime}</span>}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Messages View */
              <div className="flex-1 p-4 space-y-3 flex flex-col justify-end min-h-0">
                <div className="overflow-y-auto space-y-3 flex-grow pr-1">
                  {messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-border text-text rounded-tl-none'}`}>
                          <p>{msg.message}</p>
                          <span className={`block text-[9px] text-right mt-1 font-semibold ${isOwn ? 'text-green-150' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-10 text-xs">
                      Tanyakan ketersediaan produk atau detail lainnya ke toko ini.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input for sending messages */}
          {(activeConversationId || activeStoreId) && (
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-white flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={text}
                onChange={e => setText(e.target.value)}
                className="flex-1 border border-border rounded-xl px-3.5 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="bg-primary hover:bg-green-700 text-white p-2 rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
