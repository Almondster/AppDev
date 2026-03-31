import { useState } from 'react';
import { Send, Search, Phone, Video, MoreVertical } from 'lucide-react';
import '../styles/MessagesPage.css';

const mockConversations = [
    { id: 1, name: 'GreenCo', avatar: 'G', lastMessage: 'Can we finalize the logo by Friday?', time: '2m ago', unread: 2, online: true },
    { id: 2, name: 'TechStart', avatar: 'T', lastMessage: 'The wireframes look excellent!', time: '15m ago', unread: 0, online: true },
    { id: 3, name: 'AniHub', avatar: 'A', lastMessage: 'Please review the storyboard draft.', time: '1h ago', unread: 1, online: false },
    { id: 4, name: 'Shiko', avatar: 'S', lastMessage: 'Payment has been processed.', time: '3h ago', unread: 0, online: false },
    { id: 5, name: 'AppVenture', avatar: 'AV', lastMessage: 'Let\'s schedule a call for next week.', time: '1d ago', unread: 0, online: true },
];

const mockMessages = {
    1: [
        { id: 1, sender: 'them', text: 'Hi! We need the eco-friendly logo in SVG and PNG formats.', time: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Absolutely! I\'ll prepare both formats. Any preference for the green shade?', time: '10:32 AM' },
        { id: 3, sender: 'them', text: 'Something like forest green would be perfect.', time: '10:35 AM' },
        { id: 4, sender: 'me', text: 'Got it! I\'ll have the first draft ready by tomorrow.', time: '10:38 AM' },
        { id: 5, sender: 'them', text: 'Can we finalize the logo by Friday?', time: '10:45 AM' },
    ],
    2: [
        { id: 1, sender: 'me', text: 'Here are the updated wireframes for the landing page.', time: '9:00 AM' },
        { id: 2, sender: 'them', text: 'The wireframes look excellent!', time: '9:15 AM' },
    ],
    3: [
        { id: 1, sender: 'them', text: 'I\'ve uploaded the storyboard to the shared folder.', time: '8:00 AM' },
        { id: 2, sender: 'them', text: 'Please review the storyboard draft.', time: '8:02 AM' },
    ],
    4: [
        { id: 1, sender: 'them', text: 'Your invoice has been approved.', time: 'Yesterday' },
        { id: 2, sender: 'them', text: 'Payment has been processed.', time: 'Yesterday' },
    ],
    5: [
        { id: 1, sender: 'them', text: 'We\'d like to discuss the project scope.', time: 'Mon' },
        { id: 2, sender: 'me', text: 'Sure! What time works for you?', time: 'Mon' },
        { id: 3, sender: 'them', text: 'Let\'s schedule a call for next week.', time: 'Mon' },
    ],
};

const MessagesPage = () => {
    const [activeConversation, setActiveConversation] = useState(1);
    const [messageInput, setMessageInput] = useState('');
    const [conversations, setConversations] = useState(mockConversations);
    const [messages, setMessages] = useState(mockMessages);
    const [searchTerm, setSearchTerm] = useState('');

    const activeChat = conversations.find(c => c.id === activeConversation);
    const chatMessages = messages[activeConversation] || [];

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'me',
            text: messageInput.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => ({
            ...prev,
            [activeConversation]: [...(prev[activeConversation] || []), newMessage],
        }));

        // Update last message in conversation list
        setConversations(prev => prev.map(c =>
            c.id === activeConversation
                ? { ...c, lastMessage: messageInput.trim(), time: 'Just now', unread: 0 }
                : c
        ));

        setMessageInput('');
    };

    const handleConversationClick = (id) => {
        setActiveConversation(id);
        // Mark as read
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, unread: 0 } : c
        ));
    };

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
                    {filteredConversations.map(conv => (
                        <button
                            key={conv.id}
                            className={`conversation-item ${activeConversation === conv.id ? 'conversation-item--active' : ''}`}
                            onClick={() => handleConversationClick(conv.id)}
                        >
                            <div className="conversation-item__avatar-wrapper">
                                <div className="conversation-item__avatar">{conv.avatar}</div>
                                {conv.online && <span className="conversation-item__online-dot" />}
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
                    ))}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="messages-chat">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="messages-chat__header">
                            <div className="messages-chat__header-info">
                                <div className="conversation-item__avatar-wrapper" style={{ marginRight: '0.75rem' }}>
                                    <div className="conversation-item__avatar">{activeChat.avatar}</div>
                                    {activeChat.online && <span className="conversation-item__online-dot" />}
                                </div>
                                <div>
                                    <h3 className="messages-chat__contact-name">{activeChat.name}</h3>
                                    <span className="messages-chat__status">
                                        {activeChat.online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="messages-chat__header-actions">
                                <button className="messages-chat__action-btn" title="Voice call">
                                    <Phone size={18} />
                                </button>
                                <button className="messages-chat__action-btn" title="Video call">
                                    <Video size={18} />
                                </button>
                                <button className="messages-chat__action-btn" title="More options">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="messages-chat__body">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={`chat-bubble ${msg.sender === 'me' ? 'chat-bubble--sent' : 'chat-bubble--received'}`}>
                                    <p className="chat-bubble__text">{msg.text}</p>
                                    <span className="chat-bubble__time">{msg.time}</span>
                                </div>
                            ))}
                        </div>

                        {/* Compose */}
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
