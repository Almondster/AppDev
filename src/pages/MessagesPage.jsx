import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyMessages as apiFetchMessages, createMessage, getUserData, fetchUser, updateMessage, getToken, fetchUsers } from '../api';
import { Search, Paperclip, Send, MoreVertical, Plus } from 'lucide-react';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [userNames, setUserNames] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    
    // New Message State
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    
    const chatEndRef = useRef(null);
    const userNamesRef = useRef({});
    const markingReadRef = useRef(new Set());
    const fileInputRef = useRef(null);
    const [searchParams] = useSearchParams();
    const toParam = searchParams.get('to');

    const userData = getUserData();
    const myUid = userData?.firebase_uid ? parseInt(userData.firebase_uid, 10) : userData?.id ? parseInt(userData.id, 10) : null;

    

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
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            sender_name: msg.sender_name || names[String(msg.sender_id)],
            receiver_name: msg.receiver_name || names[String(msg.receiver_id)],
            media_url: msg.media_url || null,
        }));
    };

    const loadMessages = async (showInitialLoader = false) => {
        if (showInitialLoader) setLoading(true);
        try {
            const { ok, data } = await apiFetchMessages({ skipCache: true });
            if (ok) {
                const msgs = await hydrateMessages(data.results || data || []);
                setMessages(msgs);
                if (toParam) {
                    const targetId = parseInt(toParam, 10);
                    if (!userNamesRef.current[targetId]) {
                        const name = await getUserName(targetId);
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
            setLoading(false);
        }
    };

    // Initial Load & WebSocket
    useEffect(() => {
        loadMessages(true);

        const token = getToken();
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/api/messages/ws?token=${token}`; // Direct to backend to avoid proxy config reset

        let ws = new WebSocket(wsUrl);
        let reconnectTimer = null;
        let isSubscribed = true;

        const connectWebSocket = () => {
            if (!isSubscribed) return;
            if (ws.readyState === WebSocket.CLOSED) {
                ws = new WebSocket(wsUrl);
            }
            ws.onmessage = async (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed.type === 'message.created' || parsed.type === 'message.updated') {
                        const newMsg = parsed.message;
                        const hydrated = await hydrateMessages([newMsg]);
                        setMessages(prev => {
                            const exists = prev.find(m => m.id === hydrated[0].id);
                            if (exists) {
                                return prev.map(m => m.id === hydrated[0].id ? hydrated[0] : m);
                            }
                            return [...prev, hydrated[0]];
                        });
                    }
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };
            ws.onclose = () => {
                if (!isSubscribed) return;
                reconnectTimer = setTimeout(connectWebSocket, 3000);
            };
        };

        connectWebSocket();

    if (!myUid) { return <main className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] bg-[#080808]"><div className="flex-1 flex items-center justify-center"><p className="text-zinc-500 text-sm">Please log in to view messages</p></div></main>; }

        return () => {
            isSubscribed = false;
            if (ws) ws.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [toParam]);

    // Grouping
    const conversations = messages.reduce((acc, msg) => {
        const senderId = msg.sender_id;
        const receiverId = msg.receiver_id;
        const otherId = senderId == myUid ? receiverId : senderId;
        const otherName = senderId == myUid
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
            msg.sender_id == selectedChat &&
            msg.receiver_id == myUid &&
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
                setMessages(prev => {
                    if (prev.find(m => m.id === hydrated[0].id)) return prev;
                    return [...prev, hydrated[0]];
                });
                setNewMsg('');
            }
        } catch { /* ignore */ }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedChat || !myUid) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
            const uploadResponse = await fetch(`${API_BASE}/uploads/message-image`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Failed to upload image');

            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.url;

            const { ok, data } = await createMessage({
                receiver_id: selectedChat,
                content: '',
                media_url: imageUrl,
            });

            if (ok) {
                const hydrated = await hydrateMessages([data]);
                setMessages(prev => {
                    if (prev.find(m => m.id === hydrated[0].id)) return prev;
                    return [...prev, hydrated[0]];
                });
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fetchAllUsersForSearch = async () => {
        try {
            const { ok, data } = await fetchUsers({ page_size: 1000 });
            if (ok && Array.isArray(data)) {
                // Filter out self
                const others = data.filter(u => u.id != myUid);
                setAllUsers(others);
            } else if (ok && data.results) {
                const others = data.results.filter(u => u.id != myUid);
                setAllUsers(others);
            }
        } catch (err) {
            console.error("Failed to load users for search", err);
        }
    };

    useEffect(() => {
        if (isCreatingNew) {
            fetchAllUsersForSearch();
        }
    }, [isCreatingNew]);

    const startChatWith = (user) => {
        setUserNames(prev => {
            const next = { ...prev, [user.id]: user.username };
            userNamesRef.current = next;
            return next;
        });
        setSelectedChat(user.id);
        setIsCreatingNew(false);
    };

    const getInitial = (name) => (name || 'U').charAt(0).toUpperCase();

    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6', '#f59e0b'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const userSearchResults = allUsers.filter(u => 
        (u.username || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    if (!myUid) { return <main className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] bg-[#080808]"><div className="flex-1 flex items-center justify-center"><p className="text-zinc-500 text-sm">Please log in to view messages</p></div></main>; }

    return (
        <main className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] bg-[#080808]">
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 text-sm">
                <span className="text-zinc-500">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium">Messages</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 border-r border-white/5 flex flex-col bg-[#080808]/50 backdrop-blur-sm">
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-white font-medium flex-1">Conversations</h2>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 placeholder-zinc-600" 
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 flex gap-3 border-b border-white/[0.02] pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer shrink-0"></div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <div className="h-4 w-20 bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConvs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-zinc-500 text-sm mb-4">No conversations yet.</p>
                            </div>
                        ) : (
                            filteredConvs.map(conv => {
                                const lastMsg = conv.messages[conv.messages.length - 1];
                                const unread = conv.messages.some(m => !m.is_read && m.receiver_id == myUid && m.sender_id == conv.userId);
    if (!myUid) { return <main className="flex flex-col h-full max-h-[calc(100vh-3.5rem)] bg-[#080808]"><div className="flex-1 flex items-center justify-center"><p className="text-zinc-500 text-sm">Please log in to view messages</p></div></main>; }

                                return (
                                    <div
                                        key={conv.userId}
                                        className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-white/[0.02] relative ${selectedChat == conv.userId ? 'bg-white/5 border-l-2 border-l-blue-500' : 'hover:bg-white/[0.02]'}`}
                                        onClick={() => {
                                            setSelectedChat(conv.userId);
                                            setIsCreatingNew(false);
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0" style={{ background: getAvatarColor(conv.userName) }}>
                                            {getInitial(conv.userName)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-medium text-white truncate">{conv.userName}</span>
                                                <span className="text-xs text-zinc-500 ml-2">{formatTime(lastMsg?.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {lastMsg?.media_url && !lastMsg?.content ? '📷 Image' : (lastMsg?.content?.slice(0, 45) || '...')}
                                            </p>
                                        </div>
                                        {unread && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#080808]">
                    {isCreatingNew ? (
                        <div className="flex-1 p-8 overflow-y-auto w-full max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-white text-xl font-medium">New Message</h2>
                                    <p className="text-zinc-400 text-sm mt-1">Search for a user to start a conversation</p>
                                </div>
                                <button onClick={() => setIsCreatingNew(false)} className="px-4 py-2 hover:bg-white/5 text-zinc-300 rounded-lg text-sm transition-colors">Cancel</button>
                            </div>
                            <div className="relative mb-6">
                                <Search size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                                <input 
                                    type="text" 
                                    value={userSearchTerm} 
                                    onChange={e => setUserSearchTerm(e.target.value)} 
                                    placeholder="Search by name or email..." 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50" 
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                {allUsers.length === 0 ? (
                                    <div className="text-center text-zinc-500 text-sm py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                        Loading users...
                                    </div>
                                ) : userSearchResults.length === 0 ? (
                                    <div className="text-center text-zinc-500 text-sm py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                        No users found matching "{userSearchTerm}"
                                    </div>
                                ) : (
                                    userSearchResults.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => startChatWith(user)} 
                                            className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl cursor-pointer transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0" style={{ background: getAvatarColor(user.username) }}>
                                                {getInitial(user.username)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium text-sm">{user.username}</div>
                                                <div className="text-zinc-400 text-xs mt-0.5">{user.role || 'user'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : selectedChat && activeConv ? (
                        <>
                            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#080808]/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs" style={{ background: getAvatarColor(activeConv.userName) }}>
                                        {getInitial(activeConv.userName)}
                                    </div>
                                    <span className="text-sm font-medium text-white">{activeConv.userName}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender_id == myUid ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender_id == myUid ? 'bg-blue-600 text-white' : 'bg-white/5 text-white'}`}>
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
                                <button type="submit" className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newMsg.trim() && !fileInputRef.current?.value || isUploading}><Send size={18} /></button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
                                <Search size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-white">Your Messages</h3>
                            <p className="text-zinc-500 text-sm max-w-sm text-center">Select an existing conversation from the sidebar or start a new one to connect with others.</p>
                            <button 
                                onClick={() => setIsCreatingNew(true)} 
                                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={16} />
                                Start New Message
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default MessagesPage;
