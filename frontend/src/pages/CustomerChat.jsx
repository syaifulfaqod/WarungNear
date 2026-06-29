import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Store, MessageSquare, Loader2, Search, ArrowLeft } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore from '../store/useNotificationStore';
import { storeService } from '../services/storeService';
import { chatService } from '../services/chatService';
import { toast } from 'react-hot-toast';

const CustomerChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeIdParam = searchParams.get('storeId');

  useEffect(() => {
    useNotificationStore.getState().resetCustomerChatBadge();
  }, []);

  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    activeConversationId,
    activeStoreId,
    activeStoreName,
    setActiveConversationId,
    openChatWithStore,
    fetchConversations,
    sendMessage
  } = useChatStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize conversations
  useEffect(() => {
    const initChat = async () => {
      setInitLoading(true);
      await fetchConversations();
      
      if (storeIdParam) {
        try {
          const parsedStoreId = parseInt(storeIdParam);
          const res = await chatService.getOrCreateConversation({ storeId: parsedStoreId });
          if (res.success && res.data) {
            await fetchConversations();
            setActiveConversationId(res.data.id);
          } else {
            toast.error(res.message || 'Toko tidak ditemukan');
          }
        } catch (e) {
          console.error('Error initializing store chat:', e);
        }
      } else {
        // Reset active chat if no storeId query param is present
        setActiveConversationId(null);
      }
      setInitLoading(false);
    };

    initChat();
  }, [storeIdParam, fetchConversations, setActiveConversationId, openChatWithStore]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen to incoming real-time messages
  useEffect(() => {
    const handleIncomingMessage = () => {
      // Re-fetch conversations list to update previews
      fetchConversations();
    };

    window.addEventListener('chat:message', handleIncomingMessage);
    return () => {
      window.removeEventListener('chat:message', handleIncomingMessage);
    };
  }, [fetchConversations]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    const textToSend = text;
    setText('');

    const result = await sendMessage(textToSend);
    setLoading(false);

    if (!result.success) {
      toast.error(result.message || 'Gagal mengirim pesan');
      setText(textToSend);
    }
  };

  const activeChat = conversations.find(c => c.id === activeConversationId);
  const currentChatTitle = activeChat
    ? activeChat.store?.name
    : activeStoreName || 'Pilih Percakapan';

  const filteredConversations = conversations.filter(conv =>
    conv.store?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-gray-55/40 min-h-[calc(100vh-64px)]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Menghubungkan ke ruang obrolan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Mobile Back Button to Orders/Home */}
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden h-[650px] flex flex-col md:flex-row">
        {/* Left Side: Conversations List & Search */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col h-full shrink-0 ${activeConversationId || activeStoreId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border bg-gray-50 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base text-text">Daftar Obrolan</h2>
            </div>
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari toko..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-gray-50/20">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-400 py-32 text-xs px-4 leading-relaxed">
                <p className="font-bold mb-1">Belum ada percakapan</p>
                <p>Silakan berbelanja atau klik tombol <strong>"Chat Toko"</strong> pada pesanan Anda untuk memulai percakapan baru.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConversationId;
                const rawLastMsg = conv.messages?.[0]?.message || 'Mulai obrolan...';
                const lastMsg = rawLastMsg.replace(/^\[READY_NOTIFICATION_ORDER_\d+\]/, '');
                const lastTime = conv.messages?.[0]?.createdAt
                  ? new Date(conv.messages[0].createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={conv.id}
                    onClick={() => navigate(`/chat?storeId=${conv.store_id}`)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all flex gap-3 items-center border ${isActive ? 'bg-[#DCFCE7] border-[#16A34A] text-text shadow-xs' : 'hover:bg-gray-55 border-transparent text-gray-600'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-primary font-bold shrink-0 border border-green-150">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className="font-bold text-xs text-text truncate">{conv.store?.name}</h4>
                        {lastTime && <span className="text-[9px] text-gray-400 shrink-0 font-medium">{lastTime}</span>}
                      </div>
                      <p className={`text-xs truncate mt-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>{lastMsg}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Window */}
        <div className={`flex-1 flex flex-col h-full bg-gray-50/10 ${activeConversationId || activeStoreId ? 'flex' : 'hidden md:flex'}`}>
          {activeConversationId || activeStoreId ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-border flex items-center gap-3 shadow-xs shrink-0">
                {/* Back button on mobile to return to list */}
                <button 
                  onClick={() => navigate('/chat')}
                  className="p-1 text-gray-500 hover:text-primary md:hidden mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-primary font-black border border-green-200">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text">{currentChatTitle}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {activeConversationId ? 'Sesi Obrolan Aktif' : 'Memulai Obrolan Baru'}
                  </p>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                {messages.map(msg => {
                  const cleanText = msg.message.replace(/^\[READY_NOTIFICATION_ORDER_\d+\]/, '');

                  if (msg.is_system) {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] rounded-2xl p-4 max-w-[85%] text-xs shadow-3xs flex flex-col gap-3 relative">
                          <div className="flex gap-2.5 items-start">
                            <span className="text-sm shrink-0">ℹ️</span>
                            <div className="space-y-1">
                              <span className="font-extrabold text-[10px] text-[#2563EB] tracking-wider uppercase block">Pesan Otomatis Sistem</span>
                              <p className="whitespace-pre-wrap leading-relaxed font-semibold text-[#1E3A8A]">{cleanText}</p>
                            </div>
                          </div>
                          {msg.latitude && msg.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${msg.latitude},${msg.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-center py-2 px-4 rounded-xl font-bold transition-all shadow-3xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                            >
                              📍 Navigasi ke Toko
                            </a>
                          )}
                          <span className="block text-[8px] text-right text-[#60A5FA] font-bold mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-border text-text rounded-tl-none'}`}>
                        <p className="whitespace-pre-wrap">{cleanText}</p>
                        <span className={`block text-[8px] text-right mt-1.5 font-bold ${isOwn ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-20 text-xs px-4">
                    Ketik pesan pertama Anda untuk memulai percakapan dengan toko ini.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSend} className="p-4 border-t border-border bg-white flex gap-3 shrink-0">
                <input
                  type="text"
                  placeholder="Tulis pesan..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="bg-primary hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-350 mb-3" />
              <p className="font-semibold text-sm">Pilih obrolan dari daftar sebelah kiri</p>
              <p className="text-xs text-gray-400 mt-1">atau klik "Chat Toko" di halaman Pesanan Saya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
