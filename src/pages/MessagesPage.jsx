import React, { useState, useEffect, useRef } from 'react';
import { fetchMyMessages as apiFetchMessages, createMessage, getUserData } from '../api';
import { Search, Paperclip, Send, MoreVertical } from 'lucide-react';
import './MessagesPage.css';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const chatEndRef = useRef(null);

    const userData = getUserData();
    const myUid = userData?.firebase_uid;

    useEffect(() => {
        (async () => {
            try {
                const { ok, data } = await apiFetchMessages();
                if (ok) setMessages(data.results || data || []);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Group messages into conversations by the other user
    const conversations = messages.reduce((acc, msg) => {
        const otherId = msg.sender_id === myUid ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === myUid
            ? (msg.receiver_name || msg.receiver_id)
            : (msg.sender_name || msg.sender_id);
        if (!acc[otherId]) {
            acc[otherId] = { userId: otherId, userName: otherName, messages: [] };
        }
        acc[otherId].messages.push(msg);
        return acc;
    }, {});

    const convList = Object.values(conversations).sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.created_at || '';
        const bTime = b.messages[b.messages.length - 1]?.created_at || '';
        return new Date(bTime) - new Date(aTime);
    });

    const filteredConvs = convList.filter(c =>
        c.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeConv = selectedChat ? conversations[selectedChat] : null;
    const activeMessages = activeConv?.messages?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) || [];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages.length, selectedChat]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !selectedChat) return;
        try {
            const { ok, data } = await createMessage({
                sender_id: myUid,
                receiver_id: selectedChat,
                content: newMsg.trim(),
            });
            if (ok) {
                setMessages(prev => [...prev, data]);
                setNewMsg('');
            }
        } catch { /* ignore */ }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitial = (name) => (name || 'U').charAt(0).toUpperCase();

    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6', '#f59e0b'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <main className="msg-page">
            {/* Breadcrumb */}
            <div className="msg-breadcrumb">
                <span className="msg-bc-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="msg-bc-sep">/</span>
                <span className="msg-bc-active">Messages</span>
            </div>

            <div className="msg-container">
                {/* ── Left Panel: Conversation List ── */}
                <div className="msg-sidebar">
                    <div className="msg-search">
                        <Search size={14} className="msg-search-icon" />
                        <input type="text" placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="msg-conv-list">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="msg-conv-item" style={{ pointerEvents: 'none' }}>
                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}></div>
                                    <div className="msg-conv-info" style={{ flex: 1 }}>
                                        <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                                            <div className="skeleton" style={{ width: `${70 + (i%3)*25}px`, height: 16 }}></div>
                                            <div className="skeleton" style={{ width: 42, height: 14 }}></div>
                                        </div>
                                        <div className="skeleton" style={{ width: `${60 + (i%4)*12}%`, height: 14 }}></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConvs.length === 0 ? (
                            <p className="msg-empty-text">No conversations yet.</p>
                        ) : (
                            filteredConvs.map(conv => {
                                const lastMsg = conv.messages[conv.messages.length - 1];
                                const unread = conv.messages.some(m => !m.is_read && m.sender_id !== myUid);
                                return (
                                    <div
                                        key={conv.userId}
                                        className={`msg-conv-item ${selectedChat === conv.userId ? 'active' : ''}`}
                                        onClick={() => setSelectedChat(conv.userId)}
                                    >
                                        <div className="msg-conv-avatar" style={{ background: getAvatarColor(conv.userName) }}>
                                            {getInitial(conv.userName)}
                                        </div>
                                        <div className="msg-conv-info">
                                            <div className="msg-conv-top">
                                                <span className="msg-conv-name">{conv.userName}</span>
                                                <span className="msg-conv-time">{formatTime(lastMsg?.created_at)}</span>
                                            </div>
                                            <p className="msg-conv-preview">{lastMsg?.content?.slice(0, 45) || '...'}{(lastMsg?.content?.length || 0) > 45 ? '...' : ''}</p>
                                        </div>
                                        {unread && <span className="msg-unread-dot"></span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Chat View ── */}
                <div className="msg-chat">
                    {selectedChat && activeConv ? (
                        <>
                            <div className="msg-chat-header">
                                <div className="msg-chat-header-user">
                                    <div className="msg-conv-avatar msg-conv-avatar--sm" style={{ background: getAvatarColor(activeConv.userName) }}>
                                        {getInitial(activeConv.userName)}
                                    </div>
                                    <span className="msg-chat-header-name">{activeConv.userName}</span>
                                </div>
                                <div className="msg-chat-header-actions">
                                    <button className="msg-icon-btn"><Search size={16} /></button>
                                    <button className="msg-icon-btn"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                            <div className="msg-chat-body">
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`msg-bubble-row ${msg.sender_id === myUid ? 'mine' : 'theirs'}`}>
                                        <div className={`msg-bubble ${msg.sender_id === myUid ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`}>
                                            <p>{msg.content || msg.message || ''}</p>
                                            <span className="msg-bubble-time">{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef}></div>
                            </div>
                            <form className="msg-chat-input" onSubmit={handleSend}>
                                <button type="button" className="msg-icon-btn"><Paperclip size={18} /></button>
                                <input type="text" placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                                <button type="submit" className="msg-send-btn" disabled={!newMsg.trim()}><Send size={18} /></button>
                            </form>
                        </>
                    ) : loading ? (
                        <>
                            {/* Skeleton Chat Header */}
                            <div className="msg-chat-header">
                                <div className="msg-chat-header-user">
                                    <div className="skeleton skeleton-avatar"></div>
                                    <div className="skeleton" style={{ width: 100, height: 16 }}></div>
                                </div>
                                <div className="msg-chat-header-actions">
                                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }}></div>
                                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }}></div>
                                </div>
                            </div>
                            {/* Skeleton Chat Bubbles */}
                            <div className="msg-chat-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                                <div className="skeleton-bubble skeleton-bubble--left" style={{ width: '40%' }}>
                                    <div className="skeleton" style={{ width: '90%', height: 18, marginBottom: 8 }}></div>
                                    <div className="skeleton" style={{ width: '50%', height: 14 }}></div>
                                </div>
                                <div className="skeleton-bubble skeleton-bubble--right" style={{ width: '50%' }}>
                                    <div className="skeleton" style={{ width: '85%', height: 18, marginBottom: 8, background: 'rgba(99,102,241,0.2)' }}></div>
                                    <div className="skeleton" style={{ width: '95%', height: 18, marginBottom: 8, background: 'rgba(99,102,241,0.2)' }}></div>
                                    <div className="skeleton" style={{ width: '40%', height: 14, background: 'rgba(99,102,241,0.15)' }}></div>
                                </div>
                                <div className="skeleton-bubble skeleton-bubble--left" style={{ width: '55%' }}>
                                    <div className="skeleton" style={{ width: '80%', height: 18, marginBottom: 8 }}></div>
                                    <div className="skeleton" style={{ width: '60%', height: 18, marginBottom: 8 }}></div>
                                    <div className="skeleton" style={{ width: '30%', height: 14 }}></div>
                                </div>
                                <div className="skeleton-bubble skeleton-bubble--right" style={{ width: '45%' }}>
                                    <div className="skeleton" style={{ width: '75%', height: 18, marginBottom: 8, background: 'rgba(99,102,241,0.2)' }}></div>
                                    <div className="skeleton" style={{ width: '50%', height: 14, background: 'rgba(99,102,241,0.15)' }}></div>
                                </div>
                                <div className="skeleton-bubble skeleton-bubble--left" style={{ width: '35%' }}>
                                    <div className="skeleton" style={{ width: '90%', height: 18, marginBottom: 8 }}></div>
                                    <div className="skeleton" style={{ width: '45%', height: 14 }}></div>
                                </div>
                            </div>
                            {/* Skeleton Input Bar */}
                            <div className="msg-chat-input" style={{ pointerEvents: 'none' }}>
                                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }}></div>
                                <div className="skeleton" style={{ flex: 1, height: 42, borderRadius: 8 }}></div>
                                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }}></div>
                            </div>
                        </>
                    ) : (
                        <div className="msg-chat-empty">
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default MessagesPage;
