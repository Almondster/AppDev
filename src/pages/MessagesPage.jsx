import React from 'react';
import './MessagesPage.css';

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
        <section className="section page-fade">
            <header className="section__header">
                <h2 className="section__title">Messages</h2>
            </header>
            <div className="empty-state">
                <div className="empty-state__icon">💬</div>
                <p>No messages yet. Start a conversation!</p>
            </div>
        </section>
    );
};

export default MessagesPage;
