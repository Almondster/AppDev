import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyMessages as apiFetchMessages, createMessage, getUserData, fetchUser, updateMessage } from '../api';
import { Search, Paperclip, Send, MoreVertical } from 'lucide-react';
import './MessagesPage.css';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [userNames, setUserNames] = useState({});
    const chatEndRef = useRef(null);
    const userNamesRef = useRef({});
    const pollingRef = useRef(false);
    const markingReadRef = useRef(new Set());
    const [searchParams] = useSearchParams();
    const toParam = searchParams.get('to');

    const userData = getUserData();
    const myUid = String(userData?.firebase_uid || '');

    const getUserName = async (userId) => {
        if (!userId) return null;
        const key = String(userId);
        try {
            const { ok, data } = await fetchUser(key);
            return ok ? data?.username : null;
        } catch {
            return null;
        }
    };

    const hydrateMessages = async (msgs) => {
        const ids = [...new Set(
            msgs
                .flatMap(msg => [
                    msg.sender_name ? null : msg.sender_id,
                    msg.receiver_name ? null : msg.receiver_id,
                ])
                .filter(Boolean)
                .map(String)
        )];
        const entries = await Promise.all(ids.map(async id => [id, await getUserName(id)]));
        const names = Object.fromEntries(entries.filter(([, name]) => Boolean(name)));
        if (Object.keys(names).length) {
            setUserNames(prev => {
                const next = { ...prev, ...names };
                userNamesRef.current = next;
                return next;
            });
        }
        return msgs.map(msg => ({
            ...msg,
            sender_id: String(msg.sender_id),
            receiver_id: String(msg.receiver_id),
            sender_name: msg.sender_name || names[String(msg.sender_id)],
            receiver_name: msg.receiver_name || names[String(msg.receiver_id)],
        }));
    };

    useEffect(() => {
        let cancelled = false;

        const loadMessages = async (showInitialLoader = false) => {
            if (pollingRef.current) return;
            pollingRef.current = true;
            if (showInitialLoader) setLoading(true);
            try {
                const { ok, data } = await apiFetchMessages();
                if (ok) {
                    const msgs = await hydrateMessages(data.results || data || []);
                    if (cancelled) return;
                    setMessages(msgs);
                    // If ?to= param, auto-select that conversation
                    if (toParam) {
                        const targetId = String(toParam);
                        if (!userNamesRef.current[targetId]) {
                            const name = await getUserName(targetId);
                            if (cancelled) return;
                            if (name) {
                                setUserNames(prev => {
                                    const next = { ...prev, [targetId]: name };
                                    userNamesRef.current = next;
                                    return next;
                                });
                            }
                        }
                        setSelectedChat(targetId);
                    }
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                if (!cancelled) setLoading(false);
                pollingRef.current = false;
            }
        };

        loadMessages(true);
        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadMessages(false);
            }
        }, 2500);
        const handleFocus = () => loadMessages(false);
        window.addEventListener('focus', handleFocus);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [toParam]);

    // Group messages into conversations by the other user
    const conversations = messages.reduce((acc, msg) => {
        const senderId = String(msg.sender_id);
        const receiverId = String(msg.receiver_id);
        const otherId = senderId === myUid ? receiverId : senderId;
        const otherName = senderId === myUid
            ? (msg.receiver_name || userNames[receiverId] || 'Loading...')
            : (msg.sender_name || userNames[senderId] || 'Loading...');
        if (!acc[otherId]) {
            acc[otherId] = { userId: otherId, userName: otherName, messages: [] };
        }
        acc[otherId].messages.push(msg);
        return acc;
    }, {});

    const convList = [
        ...Object.values(conversations),
        ...(selectedChat && !conversations[selectedChat]
            ? [{ userId: selectedChat, userName: userNames[selectedChat] || 'Loading...', messages: [] }]
            : []),
    ].sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.timestamp || '';
        const bTime = b.messages[b.messages.length - 1]?.timestamp || '';
        return new Date(bTime) - new Date(aTime);
    });

    const filteredConvs = convList.filter(c =>
        c.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If toParam set but no conversation exists, create a virtual entry
    const activeConv = selectedChat ? (conversations[selectedChat] || { userId: selectedChat, userName: userNames[selectedChat] || 'Loading...', messages: [] }) : null;
    const activeMessages = activeConv?.messages?.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) || [];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages.length, selectedChat]);

    useEffect(() => {
        if (!selectedChat || activeMessages.length === 0) return;

        const unreadIncoming = activeMessages.filter(msg =>
            msg.id &&
            !msg.is_read &&
            String(msg.sender_id) === String(selectedChat) &&
            String(msg.receiver_id) === myUid &&
            !markingReadRef.current.has(msg.id)
        );

        if (unreadIncoming.length === 0) return;

        unreadIncoming.forEach(msg => markingReadRef.current.add(msg.id));
        setMessages(prev => prev.map(msg =>
            unreadIncoming.some(unread => unread.id === msg.id)
                ? { ...msg, is_read: true }
                : msg
        ));

        Promise.all(unreadIncoming.map(msg => updateMessage(msg.id, { is_read: true })))
            .finally(() => {
                unreadIncoming.forEach(msg => markingReadRef.current.delete(msg.id));
            });
    }, [activeMessages, selectedChat, myUid]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !selectedChat) return;
        try {
            const { ok, data } = await createMessage({
                receiver_id: selectedChat,
                content: newMsg.trim(),
            });
            if (ok) {
                const hydrated = await hydrateMessages([data]);
                setMessages(prev => [...prev, hydrated[0]]);
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
                                const unread = conv.messages.some(m => !m.is_read && String(m.sender_id) !== myUid);
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
                                                <span className="msg-conv-time">{formatTime(lastMsg?.timestamp)}</span>
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
                                    <div key={msg.id} className={`msg-bubble-row ${String(msg.sender_id) === myUid ? 'mine' : 'theirs'}`}>
                                        <div className={`msg-bubble ${String(msg.sender_id) === myUid ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`}>
                                            <p>{msg.content || msg.message || ''}</p>
                                            <span className="msg-bubble-time">{formatTime(msg.timestamp)}</span>
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
