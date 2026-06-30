import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { chatService } from '../../services/chatService';

const Chat = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const customerIdParam = searchParams.get('customerId');
  const orderIdParam = searchParams.get('orderId');

  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    fetchConversations,
    fetchMessages,
    sendMessage
  } = useChatStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      await fetchConversations();
      
      if (customerIdParam || orderIdParam) {
        try {
          const params = {};
          if (customerIdParam) params.customerId = customerIdParam;
          if (orderIdParam) params.orderId = orderIdParam;

          const res = await chatService.getOrCreateConversation(params);
          if (res.success && res.data) {
            await fetchConversations();
            setActiveConversationId(res.data.id);
          }
        } catch (err) {
          console.error("Error initializing owner chat:", err);
        }
      } else {
        setActiveConversationId(null);
      }
      useNotificationStore.getState().resetChatBadge();
    };
    initChat();
  }, [customerIdParam, orderIdParam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversationId) return;

    setLoading(true);
    const textToSend = text;
    setText('');

    const result = await sendMessage(textToSend);
    setLoading(false);

    if (!result.success) {
      alert(result.message || 'Gagal mengirim pesan');
      setText(textToSend);
    }
  };

  const activeChat = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white border-t border-border overflow-hidden">
      {/* Left panel: List of customer conversations */}
      <div className="w-80 border-r border-border flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border shadow-xs shrink-0 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-text">Chat Customer</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-xs px-4">
              Belum ada pesan masuk
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === activeConversationId;
              const rawLastMsg = conv.messages?.[0]?.message || 'Mulai obrolan...';
              const lastMsg = rawLastMsg.replace(/^\[READY_NOTIFICATION_ORDER_\d+\]/, '');
              const lastTime = conv.messages?.[0]?.createdAt
                ? new Date(conv.messages[0].createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex gap-3 items-center ${isActive ? 'bg-[#DCFCE7] border border-[#16A34A] text-text' : 'hover:bg-white border border-transparent text-gray-600'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-primary font-bold shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className="font-bold text-xs text-text truncate">{conv.customer?.name}</h4>
                      {lastTime && <span className="text-[9px] text-gray-450 shrink-0 font-medium">{lastTime}</span>}
                    </div>
                    {conv.store?.name && (
                      <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{conv.store.name}</p>
                    )}
                    {conv.order_id && (
                      <p className="text-[10px] font-bold text-primary mt-0.5">Pesanan #ORD-{conv.order_id}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>{lastMsg}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Chat messages window */}
      <div className="flex-1 flex flex-col h-full bg-gray-50/30">
        {activeChat ? (
          <>
            {/* Header info */}
            <div className="p-4 bg-white border-b border-border flex items-center gap-3 shadow-xs shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-primary font-black border border-green-200">
                {activeChat.customer?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <h3 className="font-bold text-sm text-text">{activeChat.customer?.name}</h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  {activeChat.customer?.email}
                  {activeChat.order_id && ` • Pesanan #ORD-${activeChat.order_id}`}
                </p>
              </div>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => {
                const cleanText = msg.message.replace(/^\[READY_NOTIFICATION_ORDER_\d+\]/, '');

                if (msg.is_system) {
                  return (
                    <div key={msg.id} className="flex justify-center my-4">
                      <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] rounded-2xl p-4 max-w-[85%] text-xs shadow-3xs flex flex-col gap-2 relative">
                        <div className="flex gap-2.5 items-start">
                          <span className="text-sm shrink-0">ℹ️</span>
                          <div className="space-y-1">
                            <span className="font-extrabold text-[10px] text-[#2563EB] tracking-wider uppercase block">Pesan Otomatis Sistem</span>
                            <p className="whitespace-pre-wrap leading-relaxed font-semibold text-[#1E3A8A]">{cleanText}</p>
                          </div>
                        </div>
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
                    <div className={`max-w-[60%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-border text-text rounded-tl-none'}`}>
                      <p>{cleanText}</p>
                      <span className={`block text-[9px] text-right mt-1.5 font-bold ${isOwn ? 'text-green-150' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-white flex gap-3 shrink-0">
              <input
                type="text"
                placeholder="Tulis balasan untuk customer..."
                value={text}
                onChange={e => setText(e.target.value)}
                className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="bg-primary hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Kirim
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
            <MessageSquare className="w-12 h-12 text-gray-350 mb-3" />
            <p className="font-semibold text-sm">Pilih customer dari daftar obrolan</p>
            <p className="text-xs text-gray-400 mt-1">Silakan klik salah satu obrolan customer di sebelah kiri.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
