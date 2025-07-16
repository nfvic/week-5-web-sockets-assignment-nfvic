import React, { useState, useEffect, useRef } from 'react';
import { useSocket, socket } from './socket/socket';

const App = () => {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [privateMsgUser, setPrivateMsgUser] = useState(null);
  const [privateMsg, setPrivateMsg] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const chatRef = useRef(null);
  const {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    reactToMessage,
    markMessageRead,
    sendFileMessage,
    setMessages,
  } = useSocket();
  const [file, setFile] = useState(null);
  const [fileCaption, setFileCaption] = useState('');
  const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false);

  const REACTIONS = ['👍', '❤️', '😂'];

  const handleConnect = () => {
    setUsernameError('');
    if (username.trim()) {
      connect(username);
      setConnected(true);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
      setTyping(false);
    }
  };

  const handleSendPrivate = (e) => {
    e.preventDefault();
    if (privateMsgUser && privateMsg.trim()) {
      sendPrivateMessage(privateMsgUser.id, privateMsg);
      setPrivateMsg('');
      setPrivateMsgUser(null);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFile({
        name: f.name,
        type: f.type,
        data: ev.target.result,
      });
    };
    reader.readAsDataURL(f);
  };
  // Send file message
  const handleSendFile = (e) => {
    e.preventDefault();
    if (file) {
      sendFileMessage(file, fileCaption);
      setFile(null);
      setFileCaption('');
    }
  };

  useEffect(() => {
    const onUsernameError = (msg) => {
      setUsernameError(msg);
      setConnected(false);
      disconnect();
    };
    socket.on('username_error', onUsernameError);
    return () => {
      socket.off('username_error', onUsernameError);
    };
  }, [disconnect]);

  useEffect(() => {
    // Sound notification
    const audio = new window.Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3'); // short notification sound
    // Browser notification
    if (window.Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    // Listen for new messages
    const handleNewMessage = (msg) => {
      // Only notify for messages not from self
      if (!msg.system && msg.sender !== username) {
        // Play sound
        audio.play();
        // Browser notification if not focused
        if (document.visibilityState !== 'visible' && window.Notification && Notification.permission === 'granted') {
          new Notification(`New message from ${msg.sender || 'Anonymous'}`, {
            body: msg.message,
            icon: '/vite.svg',
          });
        }
        // Unread count
        if (document.visibilityState !== 'visible') {
          setUnreadCount((c) => c + 1);
        }
      }
    };
    // Listen for new messages
    socket.on('receive_message', handleNewMessage);
    socket.on('private_message', handleNewMessage);
    // Reset unread count when tab is focused
    const handleFocus = () => setUnreadCount(0);
    window.addEventListener('visibilitychange', handleFocus);
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('private_message', handleNewMessage);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [username]);
  // Show unread count in title
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Chat App`;
    } else {
      document.title = 'Chat App';
    }
  }, [unreadCount]);

  useEffect(() => {
    if (!initialMessagesLoaded) {
      const fetchLatest = async () => {
        const res = await fetch('/api/messages?limit=20');
        const data = await res.json();
        setMessages(data);
        setInitialMessagesLoaded(true);
      };
      fetchLatest();
    }
  }, [initialMessagesLoaded, setMessages]);
  // Load older messages
  const loadOlderMessages = async () => {
    if (messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    const res = await fetch(`/api/messages?before=${encodeURIComponent(oldest.timestamp)}&limit=20`);
    const data = await res.json();
    if (data.length === 0) setHasMore(false);
    // Prepend older messages
    data.forEach(msg => socket.emit('receive_message', msg));
    setLoadingOlder(false);
  };

  // Mark all visible messages as read (top-level effect)
  useEffect(() => {
    messages.forEach(msg => {
      if (!msg.system && msg.id) {
        markMessageRead(msg.id);
      }
    });
  }, [messages, markMessageRead]);

  // Responsive styles
  const containerStyle = {
    width: '100vw',
    height: '100vh',
    fontFamily: 'sans-serif',
    background: '#fff',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    flexDirection: 'column',
  };
  const chatBoxStyle = {
    border: '1px solid #ccc',
    padding: 10,
    height: '60vh',
    overflowY: 'auto',
    marginBottom: 10,
    background: '#fafbfc',
    borderRadius: 6,
    flex: 1,
  };
  const inputStyle = {
    flex: 1,
    padding: 8,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
    minWidth: 0,
  };
  const buttonStyle = {
    padding: 8,
    marginLeft: 8,
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    background: '#007bff',
    color: '#fff',
    cursor: 'pointer',
  };

  // Get current username for delivery status
  const currentUsername = username;

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: 24, textAlign: 'center' }}>🔄 Socket.io Chat App</h2>
      {/* Search bar */}
      <div style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="Search messages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ padding: 8, fontSize: 16, borderRadius: 4, border: 'none', background: '#eee', color: '#333' }}>Clear</button>
        )}
      </div>
      {/* Connection status indicator */}
      {!isConnected && connected && (
        <div style={{ color: 'orange', marginBottom: 8 }}>
          {socket.connected ? 'Connected' : socket.disconnected ? 'Disconnected' : 'Reconnecting...'}
          <button
            style={{ marginLeft: 10, padding: '2px 8px', fontSize: 12 }}
            onClick={() => socket.connect()}
            disabled={socket.connected}
          >
            Retry
          </button>
        </div>
      )}
      {unreadCount > 0 && (
        <div style={{ color: 'red', marginBottom: 8 }}>
          {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
        </div>
      )}
      {!connected ? (
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ padding: 8, width: 200 }}
          />
          <button onClick={handleConnect} style={{ marginLeft: 10, padding: 8 }}>
            Connect
          </button>
          {usernameError && (
            <div style={{ color: 'red', marginTop: 8 }}>{usernameError}</div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <strong>Online Users:</strong>
            <ul>
              {users.map(user => (
                <li key={user.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {user.username}
                  {user.id !== socket.id && (
                    <button
                      style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}
                      onClick={() => {
                        setPrivateMsgUser(user);
                        setPrivateMsg('');
                      }}
                    >
                      Private Message
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {privateMsgUser && (
            <form onSubmit={handleSendPrivate} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>To <b>{privateMsgUser.username}</b>:</span>
              <input
                type="text"
                value={privateMsg}
                onChange={e => setPrivateMsg(e.target.value)}
                placeholder="Type a private message..."
                style={{ flex: 1, padding: 6 }}
                autoFocus
              />
              <button type="submit" style={{ marginLeft: 8, padding: '6px 12px' }}>Send</button>
              <button type="button" style={{ marginLeft: 4, padding: '6px 12px' }} onClick={() => setPrivateMsgUser(null)}>Cancel</button>
            </form>
          )}
          {/* File/image sharing UI */}
          <form onSubmit={handleSendFile} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
            <input type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt" onChange={handleFileChange} />
            <input type="text" placeholder="Optional caption..." value={fileCaption} onChange={e => setFileCaption(e.target.value)} style={{ flex: 1, padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }} />
            <button type="submit" style={{ padding: 8, fontSize: 16, borderRadius: 4, border: 'none', background: '#28a745', color: '#fff' }} disabled={!file}>Send File</button>
            {file && <span style={{ fontSize: 12 }}>{file.name}</span>}
          </form>
          <div style={chatBoxStyle}>
            {hasMore && (
              <button onClick={loadOlderMessages} disabled={loadingOlder} style={{ ...buttonStyle, width: '100%' }}>
                {loadingOlder ? 'Loading...' : 'Load older messages'}
              </button>
            )}
            {messages
              .filter(msg => {
                if (!search) return true;
                const text = (msg.message || '') + (msg.sender || '') + (msg.system ? msg.message : '');
                return text.toLowerCase().includes(search.toLowerCase());
              })
              .map(msg => {
                const isOwn = msg.sender === currentUsername;
                return (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        background: isOwn ? '#e6f7ff' : '#f5f5f5',
                        borderRadius: 8,
                        padding: '8px 12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        textAlign: isOwn ? 'right' : 'left',
                      }}
                    >
                      {msg.system ? (
                        <em style={{ color: '#888' }}>{msg.message}</em>
                      ) : msg.isPrivate ? (
                        <span style={{ color: '#b100b1' }}>
                          <strong>{msg.sender || 'Anonymous'} (private):</strong>
                          <span style={{ color: '#222' }}> {msg.message}</span>
                          <span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          {isOwn && (
                            <span style={{ marginLeft: 6 }}>
                              {msg.pending ? '⏳' : msg.delivered ? '✔️' : ''}
                            </span>
                          )}
                        </span>
                      ) : (
                        <>
                          <strong>{msg.sender || 'Anonymous'}:</strong>
                          <span style={{ color: '#222' }}> {msg.message}</span>
                          <span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          {isOwn && (
                            <span style={{ marginLeft: 6 }}>
                              {msg.pending ? '⏳' : msg.delivered ? '✔️' : ''}
                            </span>
                          )}
                        </>
                      )}
                      {/* File/image message display */}
                      {msg.isFile && msg.file && (
                        <div style={{ margin: '6px 0' }}>
                          {msg.file.type.startsWith('image/') ? (
                            <img src={msg.file.data} alt={msg.file.name} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 6, display: 'block', marginBottom: 4 }} />
                          ) : (
                            <a href={msg.file.data} download={msg.file.name} style={{ color: '#007bff', textDecoration: 'underline' }}>
                              {msg.file.name}
                            </a>
                          )}
                        </div>
                      )}
                      {/* Reactions UI */}
                      {!msg.system && (
                        <div style={{ marginTop: 2 }}>
                          {REACTIONS.map(r => (
                            <button
                              key={r}
                              style={{ marginRight: 4, fontSize: 16, cursor: 'pointer', border: 'none', background: 'transparent' }}
                              onClick={() => reactToMessage(msg.id, r)}
                              title={`React with ${r}`}
                            >
                              {r}
                            </button>
                          ))}
                          {/* Show current reactions */}
                          {msg.reactions && (
                            <span style={{ marginLeft: 8, fontSize: 14 }}>
                              {Object.entries(msg.reactions).map(([user, reaction]) => (
                                <span key={user} title={user} style={{ marginRight: 4 }}>{reaction}</span>
                              ))}
                            </span>
                          )}
                          {/* Show read receipts */}
                          {msg.readBy && msg.readBy.length > 0 && (
                            <span style={{ marginLeft: 12, fontSize: 12, color: '#007a00' }}>
                              Read by: {msg.readBy.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {typingUsers.length > 0 && (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                {typingUsers.join(', ')} typing...
              </div>
            )}
          </div>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              style={inputStyle}
              onBlur={() => setTyping(false)}
            />
            <button type="submit" style={buttonStyle}>
              Send
            </button>
          </form>
          <button onClick={disconnect} style={{ ...buttonStyle, background: '#eee', color: '#333', marginTop: 10 }}>
            Disconnect
          </button>
        </>
      )}
      <div style={{ marginTop: 20, color: isConnected ? 'green' : 'red' }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      {/* Responsive media query for mobile */}
      <style>{`
        @media (max-width: 600px) {
          .chat-container {
            max-width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 4vw !important;
          }
          .chat-box {
            height: 50vh !important;
            font-size: 15px !important;
          }
          .chat-input {
            font-size: 15px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;