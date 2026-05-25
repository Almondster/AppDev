import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    createMessage,
    fetchMyMessages as apiFetchMessages,
    fetchUser,
    getApiOrigin,
    getToken,
    getUserData,
    updateMessage,
} from '../api';
import { Search, Paperclip, Send, MoreHorizontal, MoreVertical, PencilLine, Check, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './MessagesPage.css';

const FALLBACK_SYNC_MS = 5000;
const POST_SEND_SYNC_DELAYS_MS = [800, 2500, 6000];
const HEARTBEAT_MS = 20000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10000;

const getSocketBase = () => {
    return getApiOrigin().replace(/^http/, 'ws');
};

const getConversationPartnerId = (message, myUid) => {
    const senderId = String(message.sender_id);
    const receiverId = String(message.receiver_id);
    return senderId === myUid ? receiverId : senderId;
};

const isPendingMessage = (message) => String(message?.id || '').startsWith('temp-') || message?.is_pending;

const toTimestamp = (value) => {
    const rawValue = typeof value === 'string' ? value.trim() : value;
    const normalizedValue = typeof rawValue === 'string' && rawValue && !/[zZ]|[+-]\d{2}:\d{2}$/.test(rawValue)
        ? `${rawValue}Z`
        : rawValue;
    const timestamp = new Date(normalizedValue || '').getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const toDate = (value) => {
    const timestamp = toTimestamp(value);
    return timestamp ? new Date(timestamp) : null;
};

const sameCalendarDay = (left, right) =>
    left?.getFullYear?.() === right?.getFullYear?.() &&
    left?.getMonth?.() === right?.getMonth?.() &&
    left?.getDate?.() === right?.getDate?.();

const formatClockTime = (value) => {
    const date = toDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatConversationTime = (value) => {
    const date = toDate(value);
    if (!date) return '';

    const now = new Date();
    if (sameCalendarDay(date, now)) {
        return formatClockTime(value);
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
    }).format(date);
};

const formatMessageTimestamp = (value) => {
    const date = toDate(value);
    if (!date) return '';

    const now = new Date();
    if (sameCalendarDay(date, now)) {
        return formatClockTime(value);
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const messagesMatch = (pendingMessage, confirmedMessage) => {
    if (!isPendingMessage(pendingMessage) || isPendingMessage(confirmedMessage)) return false;
    if (
        pendingMessage?.client_message_id &&
        confirmedMessage?.client_message_id &&
        pendingMessage.client_message_id === confirmedMessage.client_message_id
    ) {
        return true;
    }
    if (String(pendingMessage.sender_id) !== String(confirmedMessage.sender_id)) return false;
    if (String(pendingMessage.receiver_id) !== String(confirmedMessage.receiver_id)) return false;
    if ((pendingMessage.content || '').trim() !== (confirmedMessage.content || '').trim()) return false;

    const timeDelta = Math.abs(toTimestamp(pendingMessage.timestamp) - toTimestamp(confirmedMessage.timestamp));
    return timeDelta <= 15000;
};

const getMessageDisplayText = (message, myUid) => {
    if (!message) return '';
    if (message.is_deleted) {
        return String(message.sender_id) === String(myUid)
            ? 'You unsent a message'
            : 'This message was unsent';
    }
    return message.content || message.message || '';
};

const getConversationPreviewText = (message, myUid) => {
    if (!message) return '...';
    return getMessageDisplayText(message, myUid) || '...';
};

const getMessageMetaText = (message) => {
    if (!message) return '';
    const pieces = [];
    if (message.is_pending) {
        pieces.push('Sending...');
    }
    if (message.edited_at && !message.is_deleted) {
        pieces.push('edited');
    }
    if (message.timestamp) {
        pieces.push(formatMessageTimestamp(message.timestamp));
    }
    return pieces.join(' · ');
};

const upsertMessages = (existingMessages, incomingMessages, replaceSnapshot = false) => {
    const nextMessages = Array.isArray(incomingMessages) ? incomingMessages : [incomingMessages];
    const working = replaceSnapshot
        ? existingMessages.filter((message) => isPendingMessage(message))
        : [...existingMessages];

    nextMessages.forEach((incomingMessage) => {
        if (!incomingMessage) return;

        const pendingIndex = working.findIndex((message) => messagesMatch(message, incomingMessage));
        if (pendingIndex >= 0) {
            working.splice(pendingIndex, 1);
        }

        const existingIndex = working.findIndex((message) =>
            String(message.id) === String(incomingMessage.id) ||
            (
                incomingMessage?.client_message_id &&
                message?.client_message_id &&
                message.client_message_id === incomingMessage.client_message_id
            )
        );
        if (existingIndex >= 0) {
            const existingMessage = working[existingIndex];
            working[existingIndex] = {
                ...existingMessage,
                ...incomingMessage,
                // Keep optimistic read state when a slower snapshot still says unread.
                is_read: Boolean(existingMessage?.is_read || incomingMessage?.is_read),
                is_pending: false,
            };
        } else {
            working.push({ ...incomingMessage, is_pending: false });
        }
    });

    return [...working].sort((a, b) => toTimestamp(a.timestamp) - toTimestamp(b.timestamp));
};

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [userNames, setUserNames] = useState({});
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [unsendingMessageIds, setUnsendingMessageIds] = useState({});
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [unsendConfirm, setUnsendConfirm] = useState({ open: false, message: null });
    const [editingMessage, setEditingMessage] = useState(null);

    const deferredSearchTerm = useDeferredValue(searchTerm);
    const chatEndRef = useRef(null);
    const composerInputRef = useRef(null);
    const userNamesRef = useRef({});
    const websocketRef = useRef(null);
    const pollingRef = useRef(false);
    const markingReadRef = useRef(new Set());
    const reconnectTimerRef = useRef(null);
    const heartbeatTimerRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const manualSocketCloseRef = useRef(false);
    const autoSelectedRef = useRef(false);
    const selectedChatRef = useRef(null);
    const loadMessagesRef = useRef(null);
    const inflightSendKeysRef = useRef(new Set());

    const [searchParams] = useSearchParams();
    const toParam = searchParams.get('to');

    const userData = getUserData();
    const myUid = String(userData?.firebase_uid || '');

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        setOpenActionMenuId(null);
        setEditingMessage(null);
    }, [selectedChat]);

    useEffect(() => {
        if (editingMessage) {
            composerInputRef.current?.focus();
        }
    }, [editingMessage]);

    useEffect(() => {
        const handleDocumentClick = () => setOpenActionMenuId(null);
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenActionMenuId(null);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const getUserName = useCallback(async (userId) => {
        if (!userId) return null;
        const key = String(userId);
        try {
            const { ok, data } = await fetchUser(key);
            return ok ? data?.username : null;
        } catch {
            return null;
        }
    }, []);

    const hydrateMessages = useCallback(async (items) => {
        const messageList = Array.isArray(items) ? items : [items];
        const ids = [...new Set(
            messageList
                .flatMap((message) => [
                    message.sender_name ? null : message.sender_id,
                    message.receiver_name ? null : message.receiver_id,
                ])
                .filter(Boolean)
                .map(String)
        )];

        const entries = await Promise.all(ids.map(async (id) => [id, await getUserName(id)]));
        const names = Object.fromEntries(entries.filter(([, name]) => Boolean(name)));

        if (Object.keys(names).length > 0) {
            setUserNames((prev) => {
                const next = { ...prev, ...names };
                userNamesRef.current = next;
                return next;
            });
        }

        return messageList.map((message) => ({
            ...message,
            sender_id: String(message.sender_id),
            receiver_id: String(message.receiver_id),
            sender_name: message.sender_name || names[String(message.sender_id)] || userNamesRef.current[String(message.sender_id)],
            receiver_name: message.receiver_name || names[String(message.receiver_id)] || userNamesRef.current[String(message.receiver_id)],
        }));
    }, [getUserName]);

    const mergeMessages = useCallback((incoming) => {
        const nextMessages = Array.isArray(incoming) ? incoming : [incoming];
        startTransition(() => {
            setMessages((prev) => upsertMessages(prev, nextMessages, false));
        });
    }, []);

    const removeMessageById = useCallback((messageId) => {
        startTransition(() => {
            setMessages((prev) => prev.filter((message) => message.id !== messageId));
        });
    }, []);

    const ensureTargetChatSelection = useCallback(async (targetId) => {
        if (!targetId) return;

        const normalizedTargetId = String(targetId);
        if (!userNamesRef.current[normalizedTargetId]) {
            const name = await getUserName(normalizedTargetId);
            if (name) {
                setUserNames((prev) => {
                    const next = { ...prev, [normalizedTargetId]: name };
                    userNamesRef.current = next;
                    return next;
                });
            }
        }

        setSelectedChat(normalizedTargetId);
        autoSelectedRef.current = true;
    }, [getUserName]);

    const loadMessages = useCallback(async (showInitialLoader = false) => {
        if (!myUid || pollingRef.current) return;

        pollingRef.current = true;
        if (showInitialLoader) setLoading(true);

        try {
            const { ok, data } = await apiFetchMessages();
            if (!ok) {
                setError(data?.detail || 'Failed to load messages.');
                return;
            }

            const hydratedMessages = await hydrateMessages(data.results || data || []);
            startTransition(() => {
                setMessages((prev) => upsertMessages(prev, hydratedMessages, false));
            });
            setError('');

            if (toParam && !autoSelectedRef.current) {
                await ensureTargetChatSelection(toParam);
            } else if (!selectedChatRef.current && hydratedMessages.length > 0) {
                setSelectedChat(getConversationPartnerId(hydratedMessages[hydratedMessages.length - 1], myUid));
            }
        } catch (loadError) {
            console.error('Failed to load messages:', loadError);
            setError('Failed to load messages.');
        } finally {
            setLoading(false);
            pollingRef.current = false;
        }
    }, [ensureTargetChatSelection, hydrateMessages, myUid, toParam]);

    useEffect(() => {
        loadMessagesRef.current = loadMessages;
    }, [loadMessages]);

    const schedulePostSendSync = useCallback(() => {
        POST_SEND_SYNC_DELAYS_MS.forEach((delay) => {
            window.setTimeout(() => {
                loadMessagesRef.current?.(false);
            }, delay);
        });
    }, []);

    useEffect(() => {
        autoSelectedRef.current = false;
    }, [toParam]);

    useEffect(() => {
        loadMessages(true);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadMessagesRef.current?.(false);
            }
        }, FALLBACK_SYNC_MS);

        const handleFocus = () => loadMessagesRef.current?.(false);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadMessagesRef.current?.(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadMessages]);

    useEffect(() => {
        if (!myUid) return undefined;

        const token = getToken();
        if (!token) return undefined;

        let disposed = false;
        manualSocketCloseRef.current = false;

        const stopHeartbeat = () => {
            if (heartbeatTimerRef.current) {
                window.clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
        };

        const scheduleReconnect = () => {
            if (disposed || manualSocketCloseRef.current || reconnectTimerRef.current) return;

            const attempt = reconnectAttemptsRef.current;
            const delay = Math.min(RECONNECT_BASE_MS * (2 ** attempt), RECONNECT_MAX_MS);
            reconnectAttemptsRef.current += 1;
            reconnectTimerRef.current = window.setTimeout(() => {
                reconnectTimerRef.current = null;
                connectSocket();
            }, delay);
        };

        const connectSocket = () => {
            if (disposed) return;

            const currentSocket = websocketRef.current;
            if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
                return;
            }

            const socketUrl = `${getSocketBase()}/api/messages/ws?token=${encodeURIComponent(token)}`;
            const socket = new WebSocket(socketUrl);
            websocketRef.current = socket;

            socket.onopen = () => {
                reconnectAttemptsRef.current = 0;
                setError('');
                loadMessagesRef.current?.(false);

                stopHeartbeat();
                heartbeatTimerRef.current = window.setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send('ping');
                    }
                }, HEARTBEAT_MS);
            };

            socket.onmessage = async (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (!payload?.message) return;
                    const [hydratedMessage] = await hydrateMessages([payload.message]);
                    mergeMessages(hydratedMessage);
                } catch (messageError) {
                    console.error('Failed to handle message update:', messageError);
                }
            };

            socket.onerror = () => {
                setError('Realtime message connection failed. Messages may update more slowly.');
            };

            socket.onclose = () => {
                stopHeartbeat();
                if (websocketRef.current === socket) {
                    websocketRef.current = null;
                }
                if (!disposed && !manualSocketCloseRef.current) {
                    scheduleReconnect();
                }
            };
        };

        const handleOnline = () => {
            loadMessagesRef.current?.(false);
            connectSocket();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadMessagesRef.current?.(false);
                connectSocket();
            }
        };

        connectSocket();
        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            disposed = true;
            manualSocketCloseRef.current = true;

            stopHeartbeat();
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            const socket = websocketRef.current;
            websocketRef.current = null;
            if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
                socket.close();
            }
        };
    }, [hydrateMessages, mergeMessages, myUid]);

    const conversations = useMemo(() => messages.reduce((accumulator, message) => {
        const senderId = String(message.sender_id);
        const receiverId = String(message.receiver_id);
        const otherId = senderId === myUid ? receiverId : senderId;
        const otherName = senderId === myUid
            ? (message.receiver_name || userNames[receiverId] || 'Loading...')
            : (message.sender_name || userNames[senderId] || 'Loading...');

        if (!accumulator[otherId]) {
            accumulator[otherId] = { userId: otherId, userName: otherName, messages: [] };
        }

        accumulator[otherId].messages.push(message);
        return accumulator;
    }, {}), [messages, myUid, userNames]);

    const convList = useMemo(() => [
        ...Object.values(conversations),
        ...(selectedChat && !conversations[selectedChat]
            ? [{ userId: selectedChat, userName: userNames[selectedChat] || 'Loading...', messages: [] }]
            : []),
    ].sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.timestamp || '';
        const bTime = b.messages[b.messages.length - 1]?.timestamp || '';
        return toTimestamp(bTime) - toTimestamp(aTime);
    }), [conversations, selectedChat, userNames]);

    const filteredConvs = useMemo(() => convList.filter((conversation) =>
        conversation.userName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    ), [convList, deferredSearchTerm]);

    const activeConv = useMemo(() => (
        selectedChat
            ? (conversations[selectedChat] || { userId: selectedChat, userName: userNames[selectedChat] || 'Loading...', messages: [] })
            : null
    ), [conversations, selectedChat, userNames]);

    const activeMessages = useMemo(() => (
        activeConv?.messages
            ? [...activeConv.messages].sort((a, b) => toTimestamp(a.timestamp) - toTimestamp(b.timestamp))
            : []
    ), [activeConv]);

    useEffect(() => {
        if (chatEndRef.current) {
            const parent = chatEndRef.current.parentElement;
            if (parent) {
                parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [activeMessages.length, selectedChat]);

    useEffect(() => {
        if (!selectedChat || activeMessages.length === 0) return;

        const unreadIncoming = activeMessages.filter((message) =>
            message.id &&
            !message.is_read &&
            String(message.sender_id) === String(selectedChat) &&
            String(message.receiver_id) === myUid &&
            !markingReadRef.current.has(message.id)
        );

        if (unreadIncoming.length === 0) return;

        unreadIncoming.forEach((message) => markingReadRef.current.add(message.id));
        setMessages((prev) => prev.map((message) =>
            unreadIncoming.some((unread) => unread.id === message.id)
                ? { ...message, is_read: true }
                : message
        ));

        Promise.all(unreadIncoming.map((message) => updateMessage(message.id, { is_read: true })))
            .then(async (results) => {
                const failedUpdate = results.find((result) => !result?.ok);
                if (failedUpdate) {
                    setError(failedUpdate.data?.detail || 'Failed to update message status.');
                }

                const successfulUpdates = results
                    .filter((result) => result?.ok && result?.data)
                    .map((result) => result.data);

                if (successfulUpdates.length > 0) {
                    const hydratedUpdates = await hydrateMessages(successfulUpdates);
                    mergeMessages(hydratedUpdates);
                }
            })
            .finally(() => {
                unreadIncoming.forEach((message) => markingReadRef.current.delete(message.id));
            });
    }, [activeMessages, hydrateMessages, mergeMessages, selectedChat, myUid]);

    const handleSend = useCallback(async (event) => {
        event.preventDefault();
        if (!newMsg.trim() || !selectedChat || sending) return;

        const content = newMsg.trim();

        if (editingMessage?.id) {
            if (editingMessage.is_deleted) {
                setEditingMessage(null);
                setNewMsg('');
                return;
            }

            if (content === (editingMessage.content || '').trim()) {
                setEditingMessage(null);
                setNewMsg('');
                return;
            }

            setSending(true);
            setError('');
            try {
                const { ok, data } = await updateMessage(editingMessage.id, { content });
                if (!ok) {
                    setError(data?.detail || 'Failed to edit message.');
                    return;
                }

                const [hydratedMessage] = await hydrateMessages([data]);
                mergeMessages(hydratedMessage);
                setEditingMessage(null);
                setNewMsg('');
                if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                    loadMessagesRef.current?.(false);
                }
            } catch {
                setError('Failed to edit message.');
            } finally {
                setSending(false);
            }
            return;
        }

        const sendKey = `${myUid}:${selectedChat}:${content}`;
        if (inflightSendKeysRef.current.has(sendKey)) return;

        const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: optimisticId,
            client_message_id: clientMessageId,
            order_id: null,
            sender_id: myUid,
            receiver_id: String(selectedChat),
            sender_name: userData?.full_name || userData?.username || 'You',
            receiver_name: userNamesRef.current[String(selectedChat)] || activeConv?.userName || 'Loading...',
            content,
            is_read: false,
            media_url: null,
            timestamp: new Date().toISOString(),
            is_pending: true,
        };

        inflightSendKeysRef.current.add(sendKey);
        setSending(true);
        mergeMessages(optimisticMessage);
        setNewMsg('');
        setError('');

        try {
            const { ok, data } = await createMessage({
                client_message_id: clientMessageId,
                receiver_id: selectedChat,
                content,
            });

            if (!ok) {
                removeMessageById(optimisticId);
                setError(data?.detail || 'Failed to send message.');
                return;
            }

            const confirmedMessage = {
                ...data,
                sender_id: String(data.sender_id ?? myUid),
                receiver_id: String(data.receiver_id ?? selectedChat),
                client_message_id: data.client_message_id || clientMessageId,
                sender_name: data.sender_name || optimisticMessage.sender_name,
                receiver_name: data.receiver_name || optimisticMessage.receiver_name,
                is_pending: false,
            };
            mergeMessages(confirmedMessage);
            schedulePostSendSync();
            if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                loadMessagesRef.current?.(false);
            }
            setError('');
        } catch {
            removeMessageById(optimisticId);
            setError('Failed to send message.');
        } finally {
            inflightSendKeysRef.current.delete(sendKey);
            setSending(false);
        }
    }, [activeConv?.userName, editingMessage, hydrateMessages, mergeMessages, myUid, newMsg, removeMessageById, schedulePostSendSync, selectedChat, sending, userData?.full_name, userData?.username]);

    const handleStartEdit = useCallback((message) => {
        if (!message?.id || isPendingMessage(message) || message.is_deleted) return;
        if (String(message.sender_id) !== myUid) return;
        setEditingMessage(message);
        setNewMsg(message.content || '');
        setError('');
        setOpenActionMenuId(null);
    }, [myUid]);

    const handleUnsend = useCallback(async (message) => {
        if (!message?.id || isPendingMessage(message) || message.is_deleted) return false;
        if (String(message.sender_id) !== myUid) return false;
        if (unsendingMessageIds[message.id]) return false;

        const previousMessage = {
            ...message,
            sender_id: String(message.sender_id),
            receiver_id: String(message.receiver_id),
        };

        setUnsendingMessageIds((prev) => ({ ...prev, [message.id]: true }));
        startTransition(() => {
            setMessages((prev) => prev.map((item) => (
                String(item.id) === String(message.id)
                    ? {
                        ...item,
                        content: '',
                        media_url: null,
                        service_data: null,
                        is_deleted: true,
                    }
                    : item
            )));
        });
        setError('');

        try {
            const { ok, data } = await updateMessage(message.id, { is_deleted: true });
            if (!ok) {
                startTransition(() => {
                    setMessages((prev) => prev.map((item) => (
                        String(item.id) === String(message.id) ? previousMessage : item
                    )));
                });
                setError(data?.detail || 'Failed to unsend message.');
                return false;
            }

            const [hydratedMessage] = await hydrateMessages([data]);
            mergeMessages(hydratedMessage);
            if (editingMessage?.id === message.id) {
                setEditingMessage(null);
                setNewMsg('');
            }
            if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                loadMessagesRef.current?.(false);
            }
            return true;
        } catch {
            startTransition(() => {
                setMessages((prev) => prev.map((item) => (
                    String(item.id) === String(message.id) ? previousMessage : item
                )));
            });
            setError('Failed to unsend message.');
            return false;
        } finally {
            setUnsendingMessageIds((prev) => {
                const next = { ...prev };
                delete next[message.id];
                return next;
            });
        }
    }, [editingMessage?.id, hydrateMessages, mergeMessages, myUid, unsendingMessageIds]);

    const getInitial = (name) => (name || 'U').charAt(0).toUpperCase();

    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#a855f7', '#3b82f6', '#f59e0b'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i += 1) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <main className="msg-page">
            <div className="msg-breadcrumb">
                <span className="msg-bc-muted">{userData?.role === 'client' ? 'Client Workspace' : 'Creator Workspace'}</span>
                <span className="msg-bc-sep">/</span>
                <span className="msg-bc-active">Messages</span>
            </div>

            <div className="msg-container">
                <div className="msg-sidebar">
                    {error && (
                        <div style={{
                            margin: '0.75rem',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            fontSize: '0.9rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="msg-search">
                        <Search size={14} className="msg-search-icon" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <div className="msg-conv-list">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="msg-conv-item" style={{ pointerEvents: 'none' }}>
                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}></div>
                                    <div className="msg-conv-info" style={{ flex: 1 }}>
                                        <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                                            <div className="skeleton" style={{ width: `${70 + (index % 3) * 25}px`, height: 16 }}></div>
                                            <div className="skeleton" style={{ width: 42, height: 14 }}></div>
                                        </div>
                                        <div className="skeleton" style={{ width: `${60 + (index % 4) * 12}%`, height: 14 }}></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConvs.length === 0 ? (
                            <p className="msg-empty-text">No conversations yet.</p>
                        ) : (
                            filteredConvs.map((conversation) => {
                                const lastMessage = conversation.messages[conversation.messages.length - 1];
                                const unread = conversation.messages.some(
                                    (message) => !message.is_read && String(message.sender_id) !== myUid,
                                );

                                return (
                                    <div
                                        key={conversation.userId}
                                        className={`msg-conv-item ${selectedChat === conversation.userId ? 'active' : ''}`}
                                        onClick={() => setSelectedChat(conversation.userId)}
                                    >
                                        <div className="msg-conv-avatar" style={{ background: getAvatarColor(conversation.userName) }}>
                                            {getInitial(conversation.userName)}
                                        </div>
                                        <div className="msg-conv-info">
                                            <div className="msg-conv-top">
                                                <span className="msg-conv-name">{conversation.userName}</span>
                                                <span className="msg-conv-time">{formatConversationTime(lastMessage?.timestamp)}</span>
                                            </div>
                                            <p className={`msg-conv-preview ${lastMessage?.is_deleted ? 'msg-conv-preview--deleted' : ''}`}>
                                                {getConversationPreviewText(lastMessage, myUid).slice(0, 45) || '...'}
                                                {(getConversationPreviewText(lastMessage, myUid).length || 0) > 45 ? '...' : ''}
                                            </p>
                                        </div>
                                        {unread && <span className="msg-unread-dot"></span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="msg-chat">
                    {selectedChat && activeConv ? (
                        <>
                            <div className="msg-chat-header">
                                <div className="msg-chat-header-user">
                                    <div
                                        className="msg-conv-avatar msg-conv-avatar--sm"
                                        style={{ background: getAvatarColor(activeConv.userName) }}
                                    >
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
                                {activeMessages.map((message) => {
                                    const isMine = String(message.sender_id) === myUid;
                                    const isDeleted = Boolean(message.is_deleted);
                                    const displayText = getMessageDisplayText(message, myUid);
                                    const isActionMenuOpen = openActionMenuId === message.id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`msg-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                                        >
                                            {isMine && !isDeleted && !isPendingMessage(message) && (
                                                <div
                                                    className={`msg-bubble-rail ${isActionMenuOpen ? 'is-open' : ''}`}
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="msg-bubble-menu-btn"
                                                        aria-label="Message options"
                                                        aria-expanded={isActionMenuOpen}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setOpenActionMenuId((current) => (
                                                                current === message.id ? null : message.id
                                                            ));
                                                        }}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>

                                                    {isActionMenuOpen && (
                                                        <div className="msg-bubble-menu">
                                                            <button
                                                                type="button"
                                                                className="msg-bubble-menu__item"
                                                                onClick={() => handleStartEdit(message)}
                                                            >
                                                                <PencilLine size={14} />
                                                                Edit message
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="msg-bubble-menu__item msg-bubble-menu__item--danger"
                                                                disabled={Boolean(unsendingMessageIds[message.id])}
                                                                onClick={() => {
                                                                    setOpenActionMenuId(null);
                                                                    setUnsendConfirm({ open: true, message });
                                                                }}
                                                            >
                                                                {unsendingMessageIds[message.id] ? 'Unsending...' : 'Unsend'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className={`msg-bubble-stack ${isMine ? 'mine' : 'theirs'}`}>
                                                <div
                                                    className={`msg-bubble ${
                                                        isMine ? 'msg-bubble--mine' : 'msg-bubble--theirs'
                                                    } ${isDeleted ? 'msg-bubble--deleted' : ''} ${message.is_pending ? 'msg-bubble--pending' : ''}`}
                                                >
                                                    <p>{displayText}</p>
                                                    <span className="msg-bubble-time">{getMessageMetaText(message)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef}></div>
                            </div>

                            <form className={`msg-chat-input ${editingMessage ? 'is-editing' : ''}`} onSubmit={handleSend}>
                                {editingMessage && (
                                    <div className="msg-compose-mode">
                                        <div className="msg-compose-mode__copy">
                                            <span className="msg-compose-mode__eyebrow">Editing message</span>
                                            <strong>{editingMessage.receiver_name || activeConv.userName}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="msg-compose-mode__cancel"
                                            onClick={() => {
                                                setEditingMessage(null);
                                                setNewMsg('');
                                            }}
                                        >
                                            <X size={14} />
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="msg-chat-input__row">
                                    <button type="button" className="msg-icon-btn" disabled={Boolean(editingMessage)}><Paperclip size={18} /></button>
                                    <input
                                        ref={composerInputRef}
                                        type="text"
                                        placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
                                        value={newMsg}
                                        onChange={(event) => setNewMsg(event.target.value)}
                                    />
                                    <button type="submit" className="msg-send-btn" disabled={!newMsg.trim() || sending}>
                                        {editingMessage ? <Check size={18} /> : <Send size={18} />}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : loading ? (
                        <>
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

            <ConfirmModal
                open={unsendConfirm.open}
                title="Unsend message?"
                message="This will remove the message from both sides of the conversation."
                variant="danger"
                confirmLabel="Unsend"
                loading={Boolean(unsendConfirm.message?.id && unsendingMessageIds[unsendConfirm.message.id])}
                onConfirm={async () => {
                    const targetMessage = unsendConfirm.message;
                    if (!targetMessage) return;
                    const ok = await handleUnsend(targetMessage);
                    if (ok) {
                        setUnsendConfirm({ open: false, message: null });
                    }
                }}
                onCancel={() => setUnsendConfirm({ open: false, message: null })}
            />
        </main>
    );
};

export default MessagesPage;
