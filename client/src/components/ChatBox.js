import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Flex,
  Text,
  IconButton,
  Collapse,
  Avatar,
  AvatarBadge,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { 
  CloseIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import PrivateChatPrompt from './PrivateChatPrompt';

function ChatBox({ 
  selectedUser, 
  currentUser, 
  socket, 
  messages, 
  onSendMessage, 
  onBack,
  onToggleSidebar,
  isMobile,
  isGroupChat,
  onlineUsers,
  onStartPrivateChat,
  users,
}) {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [mentionedUser, setMentionedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Add effect for typing status
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleUserTyping = (data) => {
      if (data.userId === selectedUser._id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.userId === selectedUser._id) {
        setIsTyping(false);
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add formatTime function
  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const messageDate = new Date(timestamp);
      const isToday = messageDate.toDateString() === now.toDateString();
      
      if (isToday) {
        return messageDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        return messageDate.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Add handleInputChange function
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!isGroupChat && selectedUser) {
      if (value.length > 0) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        socket.emit('typing', {
          senderId: currentUser._id,
          receiverId: selectedUser._id
        });

        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stop_typing', {
            senderId: currentUser._id,
            receiverId: selectedUser._id
          });
        }, 1000);
      }
    }
  };

  // Handle double click on message
  const handleMessageDoubleClick = (message) => {
    setReplyingTo(message);
  };

  // Handle swipe on message (touch devices)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    e.currentTarget.classList.remove('swiping');
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 20) { // Minimum swipe distance
      e.currentTarget.classList.add('swiping');
    } else {
      e.currentTarget.classList.remove('swiping');
    }
    
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = (message) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Minimum swipe distance for reply

    if (isLeftSwipe) {
      handleMessageDoubleClick(message);
    }

    const element = document.querySelector('.swiping');
    if (element) {
      element.classList.remove('swiping');
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Modified send message to include reply information
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage,
        isGroupMessage: isGroupChat,
        replyTo: replyingTo
      };

      await onSendMessage(messageData);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      if (error.response?.data?.isSuspended) {
        toast({
          title: 'Account Suspended',
          description: 'Your account has been suspended. You cannot send messages.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.data?.isBlockedFromGroup) {
        toast({
          title: 'Blocked from Group Chat',
          description: 'You are blocked from sending messages in group chat. You can still chat privately.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Render reply preview
  const ReplyPreview = () => {
    if (!replyingTo || !replyingTo.sender) return null;

    return (
      <Collapse in={!!replyingTo}>
        <Box
          bg="darkTheme.300"
          p={2}
          borderRadius="md"
          mb={2}
          position="relative"
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="xs" color="brand.light" fontWeight="bold">
                Replying to {replyingTo.sender.fullName || 'Unknown User'}
              </Text>
              <Text fontSize="sm" color="gray.300" noOfLines={1}>
                {replyingTo.content || ''}
              </Text>
            </Box>
            <IconButton
              icon={<CloseIcon />}
              size="xs"
              variant="ghost"
              onClick={cancelReply}
              aria-label="Cancel reply"
            />
          </Flex>
        </Box>
      </Collapse>
    );
  };

  // Render replied message reference
  const RepliedMessagePreview = ({ replyTo }) => {
    if (!replyTo || !replyTo.sender) return null;

    return (
      <Box
        bg="darkTheme.300"
        p={2}
        borderRadius="md"
        mb={2}
        opacity={0.8}
        cursor="pointer"
        _hover={{ opacity: 1 }}
        onClick={() => {
          const originalMessage = messages.find(m => m._id === replyTo.messageId);
          if (originalMessage) {
            const element = document.getElementById(`message-${replyTo.messageId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      >
        <Text fontSize="xs" color="brand.light" fontWeight="bold">
          {replyTo.sender.fullName || 'Unknown User'}
        </Text>
        <Text fontSize="sm" color="gray.300" noOfLines={1}>
          {replyTo.content || ''}
        </Text>
      </Box>
    );
  };

  // Add function to format date for divider
  const formatDateForDivider = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Add function to check if date should show divider
  const shouldShowDateDivider = (messages, index) => {
    if (index === 0) return true;

    const currentDate = new Date(messages[index].timestamp || messages[index].createdAt);
    const prevDate = new Date(messages[index - 1].timestamp || messages[index - 1].createdAt);

    return currentDate.toDateString() !== prevDate.toDateString();
  };

  // Add DateDivider component
  const DateDivider = ({ date }) => (
    <Flex align="center" my={4}>
      <Box flex="1" h="1px" bg="darkTheme.300" />
      <Text
        mx={4}
        px={3}
        py={1}
        fontSize="xs"
        fontWeight="medium"
        color="darkTheme.500"
        bg="darkTheme.300"
        borderRadius="full"
      >
        {formatDateForDivider(date)}
      </Text>
      <Box flex="1" h="1px" bg="darkTheme.300" />
    </Flex>
  );

  // Add function to handle username click in group chat
  const handleUsernameClick = (user) => {
    if (isGroupChat && user._id !== currentUser._id) {
      setMentionedUser(user);
      onOpen();
    }
  };

  return (
    <Flex direction="column" h="100vh" maxH="100vh" position="relative">
      <Box 
        p={4} 
        borderBottom="1px" 
        borderColor="darkTheme.300" 
        bg="darkTheme.200"
        h="72px"
      >
        <Flex direction="column" height="100%" justify="center">
          <Flex align="center" gap={0}>
            {selectedUser && (
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={onBack}
                size="sm"
                aria-label="Back to Group Chat"
                variant="ghost"
                _hover={{ bg: 'darkTheme.300' }}
                title="Back to Group Chat"
                visibility="visible"
                mr={1}
              />
            )}

            <Flex align="center" gap={3}>
              {selectedUser ? (
                <>
                  <Avatar 
                    size="sm" 
                    name={selectedUser.fullName}
                    bg="brand.primary"
                    color="white"
                  >
                    {onlineUsers?.includes(selectedUser._id) && (
                      <AvatarBadge
                        boxSize='1.15em'
                        bg='status.online'
                        borderColor="darkTheme.200"
                      />
                    )}
                  </Avatar>
                  <Box minH="42px">
                    <Text fontSize="lg" fontWeight="bold" color="white" lineHeight="1.2">
                      {selectedUser.fullName}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      color="darkTheme.600"
                      lineHeight="1.2"
                      minH="16px"
                    >
                      {isTyping ? (
                        <Text 
                          color="status.online"
                          fontWeight="medium"
                        >
                          typing...
                        </Text>
                      ) : (
                        `@${selectedUser.username}`
                      )}
                    </Text>
                  </Box>
                </>
              ) : (
                <Text 
                  fontSize="xl" 
                  fontWeight="bold" 
                  color="white" 
                  lineHeight="1.2"
                  ml={2}
                >
                  Group Chat
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>
      
      <Box
        flex="1"
        overflow="auto"
        p={4}
        ref={chatContainerRef}
        bg="darkTheme.100"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'darkTheme.200',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'darkTheme.400',
            borderRadius: '24px',
          },
        }}
      >
        <VStack spacing={4} align="stretch">
          {messages.map((message, index) => {
            const senderId = message.sender._id || message.sender;
            const senderFullName = message.sender.fullName || currentUser.fullName;
            const isOwnMessage = senderId === currentUser._id;
            
            return (
              <React.Fragment key={message._id || index}>
                {shouldShowDateDivider(messages, index) && (
                  <DateDivider date={message.timestamp || message.createdAt} />
                )}
                <Flex
                  justify={isOwnMessage ? 'flex-end' : 'flex-start'}
                  id={`message-${message._id}`}
                  onDoubleClick={() => handleMessageDoubleClick(message)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(message)}
                  position="relative"
                  className="message-container"
                  sx={{
                    '&.swiping': {
                      transform: 'translateX(-20px)',
                      transition: 'transform 0.2s',
                    }
                  }}
                >
                  <Box
                    maxW={{ base: "80%", md: "70%" }}
                    bg={isOwnMessage ? 'brand.primary' : 'darkTheme.400'}
                    color="white"
                    borderRadius="lg"
                    px={4}
                    py={2}
                    boxShadow="sm"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      filter: 'brightness(1.1)',
                    }}
                  >
                    {isGroupChat && !isOwnMessage && (
                      <Text 
                        fontSize="xs" 
                        color="brand.light" 
                        fontWeight="bold" 
                        mb={1}
                        cursor="pointer"
                        onClick={() => handleUsernameClick(message.sender)}
                        _hover={{
                          textDecoration: 'underline',
                          color: 'brand.primary'
                        }}
                        transition="all 0.2s"
                      >
                        {senderFullName}
                      </Text>
                    )}
                    
                    {/* Show replied message if exists */}
                    {message.replyTo && (
                      <RepliedMessagePreview replyTo={message.replyTo} />
                    )}

                    <Text
                      wordBreak="break-word"
                      whiteSpace="pre-wrap"
                    >
                      {message.content}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
                      {formatTime(message.timestamp || message.createdAt)}
                    </Text>
                  </Box>
                </Flex>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box p={4} borderTop="1px" borderColor="darkTheme.300" bg="darkTheme.200">
        {/* Reply Preview */}
        <ReplyPreview />
        
        <Flex>
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder={
              replyingTo 
                ? `Reply to ${replyingTo.sender.fullName}...` 
                : isGroupChat 
                  ? "Send a message to everyone..." 
                  : "Type a message..."
            }
            mr={2}
            variant="filled"
            bg="darkTheme.400"
            _hover={{ bg: 'darkTheme.300' }}
            _focus={{ bg: 'darkTheme.400', borderColor: 'brand.primary' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button
            onClick={handleSendMessage}
            bg="brand.primary"
            _hover={{ bg: 'brand.secondary' }}
          >
            Send
          </Button>
        </Flex>
      </Box>

      {/* Add PrivateChatPrompt */}
      <PrivateChatPrompt
        isOpen={isOpen}
        onClose={onClose}
        user={mentionedUser}
        onStartPrivateChat={onStartPrivateChat}
      />
    </Flex>
  );
}

export default ChatBox; 