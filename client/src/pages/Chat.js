import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Grid,
  GridItem,
  Box,
  Text,
  useToast,
  Flex,
  Button,
  Spinner,
  useBreakpointValue,
  Avatar,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatBox from '../components/ChatBox';
import ColorPicker from '../components/ColorPicker';
import { useCustomTheme } from '../hooks/useCustomTheme';
import Disclaimer from '../components/Disclaimer';

// Add custom logout icon component
const LogoutIcon = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M16 13v-2H7V8l-5 4 5 4v-3z"></path>
    <path d="M20 3h-9c-1.103 0-2 .897-2 2v4h2V5h9v14h-9v-4H9v4c0 1.103.897 2 2 2h9c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"></path>
  </svg>
);

// Update the AnonymityIcon component
const AnonymityIcon = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Head */}
    <circle cx="12" cy="8" r="5" />
    
    {/* Body */}
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    
    {/* Privacy shield */}
    <path d="M12 3a6 6 0 0 1 6 6c0 4-3 6-6 6s-6-2-6-6a6 6 0 0 1 6-6z" />
    
    {/* Lock symbol */}
    <circle cx="12" cy="8" r="1" />
    <path d="M12 9v2" />
  </svg>
);

function Chat() {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const [unreadMessages, setUnreadMessages] = useState({});
  const [groupMessages, setGroupMessages] = useState([]);
  const { primaryColor, handleColorChange } = useCustomTheme();
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  const chatAreaRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Wrap handleLogout in useCallback
  const handleLogout = useCallback(() => {
    if (socket) {
      socket.close();
    }
    logout();
  }, [socket, logout]);

  // Hide sidebar automatically when user is selected on mobile
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch messages when user selects a chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !user) return;
      
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/chats/${user._id}/${selectedUser._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchMessages();
  }, [selectedUser, user, toast]);

  // Initialize socket connection
  useEffect(() => {
    let newSocket;
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      newSocket = io(process.env.REACT_APP_SOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token: user.token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        newSocket.emit('user_connected', user._id);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        newSocket.emit('user_connected', user._id);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log('Cleaning up socket connection...');
          newSocket.disconnect();
        }
      };
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError('Failed to initialize chat connection');
    }
  }, [user, navigate]);

  // Fetch users
  useEffect(() => {
    const fetchUsersAndMessages = async () => {
      try {
        if (!user) return;

        // Fetch users
        const { data: usersData } = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        const otherUsers = usersData.filter(u => u._id !== user._id);

        // Fetch all private messages to get last message timestamps
        const timestamps = {};
        await Promise.all(otherUsers.map(async (otherUser) => {
          try {
            const { data: messages } = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/chats/${user._id}/${otherUser._id}`,
              {
                headers: { Authorization: `Bearer ${user.token}` }
              }
            );
            // Get the timestamp of the last message if any
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
              timestamps[otherUser._id] = new Date(lastMessage.createdAt).getTime();
            } else {
              timestamps[otherUser._id] = 0; // No messages yet
            }
          } catch (error) {
            console.error(`Error fetching messages for user ${otherUser._id}:`, error);
            timestamps[otherUser._id] = 0;
          }
        }));

        // Sort users based on last message timestamp
        const sortedUsers = otherUsers.sort((a, b) => {
          const timeA = timestamps[a._id] || 0;
          const timeB = timestamps[b._id] || 0;
          return timeB - timeA; // Sort in descending order (most recent first)
        });

        setLastMessageTimestamps(timestamps);
        setUsers(sortedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users');
        setLoading(false);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch users',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchUsersAndMessages();
  }, [user, toast]);

  // Fetch group messages
  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!user) return;
      
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/chats/group`,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        setGroupMessages(data);
      } catch (error) {
        console.error('Error fetching group messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load group messages',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchGroupMessages();
  }, [user, toast]);

  // Update the socket event handler
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('user_connected', user._id);

    socket.on('user_status_update', (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    });

    socket.on('receive_message', (messageData) => {
      console.log('Received message:', messageData); // Debug log

      // For group messages
      if (messageData.isGroupMessage) {
        setGroupMessages(prev => {
          const exists = prev.some(msg => msg._id === messageData._id);
          if (!exists) {
            return [...prev, messageData];
          }
          return prev;
        });
        return;
      }

      // For private messages
      if (selectedUser) {
        // If message is from or to the selected user
        if (messageData.sender._id === selectedUser._id || 
            messageData.sender._id === user._id) {
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === messageData._id);
            if (!exists) {
              return [...prev, messageData];
            }
            return prev;
          });
        }
      }

      // Update unread messages count
      if (messageData.sender._id !== user._id && 
          (!selectedUser || messageData.sender._id !== selectedUser._id)) {
        setUnreadMessages(prev => ({
          ...prev,
          [messageData.sender._id]: (prev[messageData.sender._id] || 0) + 1
        }));
      }

      // Update last message timestamp and resort users
      if (!messageData.isGroupMessage) {
        const senderId = messageData.sender._id;
        const timestamp = new Date(messageData.createdAt).getTime();
        
        setLastMessageTimestamps(prev => ({
          ...prev,
          [senderId]: timestamp
        }));

        setUsers(prevUsers => {
          const newUsers = [...prevUsers];
          return newUsers.sort((a, b) => {
            const timeA = a._id === senderId ? timestamp : (lastMessageTimestamps[a._id] || 0);
            const timeB = b._id === senderId ? timestamp : (lastMessageTimestamps[b._id] || 0);
            return timeB - timeA;
          });
        });
      }
    });

    // Add force logout handler
    socket.on('force_logout', (data) => {
      toast({
        title: 'Account Deleted',
        description: data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      handleLogout();
    });

    // Add user deleted handler
    socket.on('user_deleted', (deletedUserId) => {
      // Remove user from users list
      setUsers(prev => prev.filter(u => u._id !== deletedUserId));
      
      // If we were chatting with this user, go back to group chat
      if (selectedUser?._id === deletedUserId) {
        setSelectedUser(null);
        toast({
          title: 'User Unavailable',
          description: 'This user\'s account has been deleted',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    });

    return () => {
      socket.off('user_status_update');
      socket.off('receive_message');
      socket.off('force_logout');
      socket.off('user_deleted');
    };
  }, [socket, user, selectedUser, handleLogout, toast, lastMessageTimestamps]);

  // Update the message sending logic
  const handleSendMessage = async (messageData) => {
    try {
      const messageToSend = {
        sender: user._id,
        content: messageData.content,
        isGroupMessage: !selectedUser
      };

      // Add receiver only for private messages
      if (selectedUser) {
        messageToSend.receiver = selectedUser._id;
      }

      // Add reply information if exists
      if (messageData.replyTo) {
        messageToSend.replyTo = {
          messageId: messageData.replyTo._id,
          content: messageData.replyTo.content,
          sender: messageData.replyTo.sender._id
        };
      }

      console.log('Sending message:', messageToSend); // Debug log

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chats`,
        messageToSend,
        {
          headers: { 
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const savedMessage = {
        ...response.data,
        isGroupMessage: !selectedUser
      };

      console.log('Saved message:', savedMessage); // Debug log
      
      // Update local state immediately
      if (!selectedUser) {
        setGroupMessages(prev => [...prev, savedMessage]);
      } else {
        setMessages(prev => [...prev, savedMessage]);
      }
      
      // Emit the message through socket
      socket.emit('send_message', savedMessage);

      // Update last message timestamp and resort users
      if (!messageData.isGroupMessage && selectedUser) {
        const timestamp = new Date().getTime();
        setLastMessageTimestamps(prev => ({
          ...prev,
          [selectedUser._id]: timestamp
        }));

        setUsers(prevUsers => {
          const newUsers = [...prevUsers];
          return newUsers.sort((a, b) => {
            const timeA = a._id === selectedUser._id ? timestamp : (lastMessageTimestamps[a._id] || 0);
            const timeB = b._id === selectedUser._id ? timestamp : (lastMessageTimestamps[b._id] || 0);
            return timeB - timeA;
          });
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // Clear unread messages for this user
    setUnreadMessages(prev => ({
      ...prev,
      [user._id]: 0
    }));
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Add handler for chat area click
  const handleChatAreaClick = () => {
    if (showSidebar && isMobile) {
      setShowSidebar(false);
    }
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.changedTouches[0].screenX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50; // Minimum swipe distance in px
    
    if (distance < -minSwipeDistance) { // Swipe Right
      setShowSidebar(true);
    }
  };

  if (loading) {
    return (
      <Flex height="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex height="100vh" align="center" justify="center" direction="column" gap={4}>
        <Text color="red.500">{error}</Text>
        <Button colorScheme="blue" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Flex>
    );
  }

  return (
    <Box h="100vh" overflow="hidden" position="relative">
      {/* Top Control Bar */}
      <Flex 
        position="absolute" 
        right="4" 
        top="4" 
        zIndex="1"
        align="center" 
        gap={4}
        bg="darkTheme.300"
        p={2}
        borderRadius="lg"
        boxShadow="sm"
        transition="all 0.2s ease"
        _hover={{
          bg: 'darkTheme.400',
          transform: 'translateY(-1px)',
        }}
      >
        {/* Conditionally render User Info only in Group Chat */}
        {!selectedUser && (
          <Flex align="center" gap={2}>
            <Avatar 
              size="xs" 
              name={user.fullName}
              bg="darkTheme.200"
              color="white"
            />
            <Box>
              <Text 
                fontSize="xs" 
                fontWeight="medium" 
                color="darkTheme.500"
                lineHeight="tight"
              >
                {user.fullName}
              </Text>
              <Text 
                fontSize="10px" 
                color="darkTheme.600"
                lineHeight="tight"
              >
                @{user.username}
              </Text>
            </Box>
          </Flex>
        )}
        
        {/* Theme Changer */}
        <ColorPicker 
          onColorChange={handleColorChange}
          currentColor={primaryColor}
        />
      </Flex>
      
      <Grid
        templateColumns={{
          base: "1fr",
          md: showSidebar ? "300px 1fr" : "auto 1fr"
        }}
        h="100%"
        bg="darkTheme.100"
      >
        {/* Sidebar */}
        <GridItem 
          borderRight="1px" 
          borderColor="darkTheme.300" 
          position={{ base: "fixed", md: "relative" }}
          bg="darkTheme.200"
          zIndex="2"
          h="100vh"
          w={{ base: "300px", md: "100%" }}
          transform={{
            base: showSidebar ? "translateX(0)" : "translateX(-100%)",
            md: showSidebar ? "translateX(0)" : "translateX(-100%)"
          }}
          transition="transform 0.3s ease"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          {/* Header */}
          <Box 
            p={4} 
            borderBottom="1px" 
            borderColor="darkTheme.300"
            bg="darkTheme.100"
            boxShadow="0 1px 2px rgba(0, 0, 0, 0.1)"
          >
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <AnonymityIcon 
                  style={{ 
                    opacity: 0.8,
                    color: 'var(--chakra-colors-darkTheme-500)'
                  }} 
                />
                <Text fontSize="xl" fontWeight="bold">Chats</Text>
              </Flex>
              <Disclaimer />
            </Flex>
          </Box>

          {/* Chat List with custom scrollbar */}
          <Box 
            overflow="auto" 
            flex="1"
            h="calc(100vh - 140px)"
            className="sidebar-scroll"
            overflowX="hidden"
            bg="darkTheme.200"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#111111',
                borderRadius: '24px',
                margin: '4px 0',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-brand-primary)',
                borderRadius: '24px',
                minHeight: '40px',
                border: '2px solid transparent',
                backgroundClip: 'content-box',
                '&:hover': {
                  backgroundColor: 'var(--chakra-colors-brand-secondary)',
                }
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--chakra-colors-brand-primary) #111111',
              '& > div': {
                width: '100%',
                paddingRight: '1px',
              }
            }}
          >
            {users.length > 0 ? (
              <ChatList
                users={users}
                onlineUsers={onlineUsers}
                selectedUser={selectedUser}
                onSelectUser={handleUserSelect}
                unreadMessages={unreadMessages}
              />
            ) : (
              <Flex p={4} justify="center">
                <Text color="darkTheme.600">No users available</Text>
              </Flex>
            )}
          </Box>

          {/* Logout Button */}
          <Box 
            p={4} 
            borderTop="1px" 
            borderColor="darkTheme.300"
            bg="darkTheme.300"
            boxShadow="0 -1px 2px rgba(0, 0, 0, 0.1)"
          >
            <Button 
              width="100%" 
              variant="logout"
              onClick={handleLogout}
              leftIcon={<LogoutIcon style={{ fontSize: '20px' }} />}
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              px={4}
            >
              Logout
            </Button>
          </Box>
        </GridItem>

        {/* Main Chat Area - Add swipe handlers */}
        <GridItem 
          position="relative"
          ml={{ base: 0, md: showSidebar ? 0 : "0" }}
          transition="margin-left 0.3s ease"
          onClick={handleChatAreaClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={chatAreaRef} // Add a ref for swipe detection
        >
          {/* Remove Toggle Sidebar Button */}
          {/* Swipe functionality replaces the hamburger button */}
          
          {selectedUser ? (
            <Box>
              <ChatBox
                selectedUser={selectedUser}
                currentUser={user}
                socket={socket}
                messages={messages}
                setMessages={setMessages}
                onSendMessage={handleSendMessage}
                onBack={() => {
                  setSelectedUser(null);
                  if (isMobile) {
                    setShowSidebar(true);
                  }
                }}
                showSidebarButton={!showSidebar && isMobile}
                onToggleSidebar={() => setShowSidebar(true)}
                isMobile={isMobile}
                onlineUsers={onlineUsers}
                onStartPrivateChat={handleUserSelect}
                users={users}
              />
            </Box>
          ) : (
            <Box>
              <ChatBox
                selectedUser={null}
                currentUser={user}
                socket={socket}
                messages={groupMessages}
                setMessages={setGroupMessages}
                onSendMessage={handleSendMessage}
                showSidebarButton={!showSidebar && isMobile}
                onToggleSidebar={() => setShowSidebar(true)}
                isMobile={isMobile}
                isGroupChat={true}
                onlineUsers={onlineUsers}
                onStartPrivateChat={handleUserSelect}
                users={users}
              />
            </Box>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
}

export default Chat; 