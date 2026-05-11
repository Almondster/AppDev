import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyMessages as apiFetchMessages, createMessage, getUserData, fetchUser, updateMessage } from '../api';
import { Search, Paperclip, Send, MoreVertical } from 'lucide-react';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [userNames, setUserNames] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const chatEndRef = useRef(null);
    const userNamesRef = useRef({});
    const pollingRef = useRef(false);
    const markingReadRef = useRef(new Set());
    const fileInputRef = useRef(null);
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
            media_url: msg.media_url || null,
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

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedChat || !myUid) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            // Upload file to backend
            const formData = new FormData();
            formData.append('file', file);

            const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
            const uploadResponse = await fetch(`${API_BASE}/uploads/message-image`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.url;

            // Create message with image
            const { ok, data } = await createMessage({
                receiver_id: selectedChat,
                content: '', // Empty content for image-only messages
                media_url: imageUrl,
            });

            if (ok) {
                const hydrated = await hydrateMessages([data]);
                setMessages(prev => [...prev, hydrated[0]]);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
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
        <main className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] bg-[#080808]">
            {/* Breadcrumb */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 text-sm">
                <span className="text-zinc-500">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">Messages</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Panel: Conversation List ── */}
                <div className="w-80 border-r border-white/5 flex flex-col bg-[#080808]/50 backdrop-blur-sm">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
                            <input type="text" placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 flex gap-3 border-b border-white/[0.02] pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer shrink-0"></div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <div className={`h-4 rounded bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer`} style={{ width: `${70 + (i%3)*25}px` }}></div>
                                            <div className="h-3 w-10 bg-white/5 rounded"></div>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded" style={{ width: `${60 + (i%4)*12}%` }}></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConvs.length === 0 ? (
                            <p className="text-center text-zinc-500 text-sm py-8">No conversations yet.</p>
                        ) : (
                            filteredConvs.map(conv => {
                                const lastMsg = conv.messages[conv.messages.length - 1];
                                const unread = conv.messages.some(m => 
                                    !m.is_read && 
                                    String(m.receiver_id) === myUid && 
                                    String(m.sender_id) === conv.userId
                                );
                                return (
                                    <div
                                        key={conv.userId}
                                        className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-white/[0.02] relative ${selectedChat === conv.userId ? 'bg-white/5 border-l-2 border-l-blue-500' : 'hover:bg-white/[0.02]'}`}
                                        onClick={() => setSelectedChat(conv.userId)}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0" style={{ background: getAvatarColor(conv.userName) }}>
                                            {getInitial(conv.userName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-medium text-white truncate">{conv.userName}</span>
                                                <span className="text-xs text-zinc-500 ml-2">{formatTime(lastMsg?.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 truncate">{lastMsg?.content?.slice(0, 45) || '...'}{(lastMsg?.content?.length || 0) > 45 ? '...' : ''}</p>
                                        </div>
                                        {unread && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Chat View ── */}
                <div className="flex-1 flex flex-col bg-[#080808]">
                    {selectedChat && activeConv ? (
                        <>
                            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#080808]/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs" style={{ background: getAvatarColor(activeConv.userName) }}>
                                        {getInitial(activeConv.userName)}
                                    </div>
                                    <span className="text-sm font-medium text-white">{activeConv.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><Search size={16} /></button>
                                    <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${String(msg.sender_id) === myUid ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${String(msg.sender_id) === myUid ? 'bg-blue-600 text-white' : 'bg-white/5 text-white'}`}>
                                            {msg.media_url ? (
                                                <img 
                                                    src={msg.media_url.startsWith('http') ? msg.media_url : `${import.meta.env.VITE_API_BASE_URL || ''}${msg.media_url}`} 
                                                    alt="Shared image" 
                                                    className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(msg.media_url.startsWith('http') ? msg.media_url : `${import.meta.env.VITE_API_BASE_URL || ''}${msg.media_url}`, '_blank')}
                                                />
                                            ) : null}
                                            {msg.content && <p className="text-sm break-words">{msg.content || msg.message || ''}</p>}
                                            <span className="text-xs opacity-70 mt-1 block">{formatTime(msg.timestamp)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef}></div>
                            </div>
                            <form className="p-4 border-t border-white/5 flex items-center gap-3" onSubmit={handleSend}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <input type="text" placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" disabled={isUploading} />
                                <button type="submit" className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newMsg.trim() || isUploading}><Send size={18} /></button>
                            </form>
                        </>
                    ) : loading ? (
                        <>
                            {/* Skeleton Chat Header */}
                            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#080808]/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                                    <div className="h-4 w-28 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/5"></div>
                                    <div className="w-8 h-8 rounded-full bg-white/5"></div>
                                </div>
                            </div>
                            {/* Skeleton Chat Bubbles */}
                            <div className="flex-1 overflow-hidden p-6 space-y-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl p-4 space-y-2 ${i % 2 === 0 ? 'bg-blue-500/10' : 'bg-white/[0.03]'}`}>
                                            <div className={`h-4 ${i % 3 === 0 ? 'w-64' : i % 3 === 1 ? 'w-48' : 'w-56'} bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded`}></div>
                                            {i % 2 === 0 && <div className="h-4 w-32 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded"></div>}
                                            <div className="h-3 w-12 bg-white/5 rounded mt-2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Skeleton Input Bar */}
                            <div className="p-4 border-t border-white/5 pointer-events-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                    <div className="flex-1 h-11 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
                                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-zinc-500 text-sm">Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default MessagesPage;
