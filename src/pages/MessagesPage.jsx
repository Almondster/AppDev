import { useState, useEffect, useRef } from 'react';
import { fetchMessages, sendMessage as apiSendMessage, fetchUsers } from '../services/api';
import { Send, Search, Phone, Video, MoreVertical } from 'lucide-react';
import '../styles/MessagesPage.css';

const MessagesPage = ({ firebaseUid }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [userMap, setUserMap] = useState({});
    const chatBodyRef = useRef(null);

    // Load all messages for the current user and build conversation list
    useEffect(() => {
        if (!firebaseUid) return;
        setLoading(true);

        Promise.all([
            fetchMessages({ user_id: firebaseUid }),
            fetchUsers(),
        ]).then(([msgData, userData]) => {
            const allMessages = msgData?.results || msgData || [];
            const allUsers = userData?.results || userData || [];

            // Build user map for display names
            const uMap = {};
            allUsers.forEach(u => {
                uMap[u.firebase_uid] = {
                    name: u.full_name || u.display_name || u.email || 'Unknown',
                    avatar: (u.full_name || u.email || '?').charAt(0).toUpperCase(),
                };
            });
            setUserMap(uMap);

            // Group messages into conversations by the other user
            const convMap = {};
            allMessages.forEach(msg => {
                const otherUid = msg.sender_id === firebaseUid ? msg.receiver_id : msg.sender_id;
                if (!convMap[otherUid]) {
                    convMap[otherUid] = {
                        id: otherUid,
                        name: msg.sender_id === firebaseUid
                            ? (msg.receiver_name || uMap[otherUid]?.name || otherUid)
                            : (msg.sender_name || uMap[otherUid]?.name || otherUid),
                        avatar: (uMap[otherUid]?.avatar || '?'),
                        messages: [],
                        lastMessage: '',
                        time: '',
                        unread: 0,
                    };
                }
                convMap[otherUid].messages.push({
                    id: msg.id,
                    sender: msg.sender_id === firebaseUid ? 'me' : 'them',
                    text: msg.content,
                    time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    created_at: msg.created_at,
                });
                if (!msg.is_read && msg.sender_id !== firebaseUid) {
                    convMap[otherUid].unread += 1;
                }
            });

            // Sort messages within each conversation and set last message
            const convList = Object.values(convMap).map(conv => {
                conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                const last = conv.messages[conv.messages.length - 1];
                conv.lastMessage = last?.text || '';
                conv.time = last?.time || '';
                return conv;
            });

            setConversations(convList);
            if (convList.length > 0 && !activeConversation) {
                setActiveConversation(convList[0].id);
                setMessages(convList[0].messages);
            }
        })
        .catch(err => console.error('Failed to load messages:', err))
        .finally(() => setLoading(false));
    }, [firebaseUid]);

    // Update messages when conversation changes
    useEffect(() => {
        const conv = conversations.find(c => c.id === activeConversation);
        if (conv) setMessages(conv.messages);
    }, [activeConversation, conversations]);

    // Scroll to bottom
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleConversationClick = (id) => {
        setActiveConversation(id);
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, unread: 0 } : c
        ));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConversation) return;

        try {
            await apiSendMessage({
                sender_id: firebaseUid,
                receiver_id: activeConversation,
                content: messageInput.trim(),
            });

            const newMsg = {
                id: Date.now(),
                sender: 'me',
                text: messageInput.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages(prev => [...prev, newMsg]);
            setConversations(prev => prev.map(c =>
                c.id === activeConversation
                    ? { ...c, messages: [...c.messages, newMsg], lastMessage: messageInput.trim(), time: 'Just now' }
                    : c
            ));
            setMessageInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const activeChat = conversations.find(c => c.id === activeConversation);
    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <section className="messages-page page-fade">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
                    <p>Loading messages...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="messages-page page-fade">
            {/* Conversations Sidebar */}
            <aside className="messages-sidebar">
                <div className="messages-sidebar__header">
                    <h2 className="messages-sidebar__title">Messages</h2>
                </div>
                <div className="messages-sidebar__search">
                    <Search size={16} className="messages-sidebar__search-icon" />
                    <label htmlFor="messagesSearch" className="sr-only">Search conversations</label>
                    <input
                        id="messagesSearch"
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="messages-sidebar__search-input"
                    />
                </div>
                <div className="messages-sidebar__list">
                    {filteredConversations.length > 0 ? filteredConversations.map(conv => (
                        <button
                            key={conv.id}
                            className={`conversation-item ${activeConversation === conv.id ? 'conversation-item--active' : ''}`}
                            onClick={() => handleConversationClick(conv.id)}
                        >
                            <div className="conversation-item__avatar-wrapper">
                                <div className="conversation-item__avatar">{conv.avatar}</div>
                            </div>
                            <div className="conversation-item__content">
                                <div className="conversation-item__top-row">
                                    <span className="conversation-item__name">{conv.name}</span>
                                    <span className="conversation-item__time">{conv.time}</span>
                                </div>
                                <div className="conversation-item__bottom-row">
                                    <p className="conversation-item__preview">{conv.lastMessage}</p>
                                    {conv.unread > 0 && (
                                        <span className="conversation-item__badge">{conv.unread}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    )) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <p>No conversations yet.</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="messages-chat">
                {activeChat ? (
                    <>
                        <div className="messages-chat__header">
                            <div className="messages-chat__header-info">
                                <div className="conversation-item__avatar-wrapper" style={{ marginRight: '0.75rem' }}>
                                    <div className="conversation-item__avatar">{activeChat.avatar}</div>
                                </div>
                                <div>
                                    <h3 className="messages-chat__contact-name">{activeChat.name}</h3>
                                </div>
                            </div>
                            <div className="messages-chat__header-actions">
                                <button className="messages-chat__action-btn" title="Voice call"><Phone size={18} /></button>
                                <button className="messages-chat__action-btn" title="Video call"><Video size={18} /></button>
                                <button className="messages-chat__action-btn" title="More options"><MoreVertical size={18} /></button>
                            </div>
                        </div>

                        <div className="messages-chat__body" ref={chatBodyRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={`chat-bubble ${msg.sender === 'me' ? 'chat-bubble--sent' : 'chat-bubble--received'}`}>
                                    <p className="chat-bubble__text">{msg.text}</p>
                                    <span className="chat-bubble__time">{msg.time}</span>
                                </div>
                            ))}
                        </div>

                        <form className="messages-chat__compose" onSubmit={handleSend}>
                            <label htmlFor="messageInput" className="sr-only">Type a message</label>
                            <input
                                id="messageInput"
                                type="text"
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                className="messages-chat__input"
                            />
                            <button type="submit" className="messages-chat__send-btn" disabled={!messageInput.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="messages-chat__empty">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </main>
        </section>
    );
};

export default MessagesPage;
