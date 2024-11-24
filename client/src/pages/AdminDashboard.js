import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  useToast,
  Badge,
  Flex,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon, WarningIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // Add socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Fetch users and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const [usersRes, messagesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/chats/group', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUsers(usersRes.data);
        setGroupMessages(messagesRes.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        if (error.response?.status === 401) {
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  // Handle user actions
  const handleUserAction = async (userId, action) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Admin authentication required',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/admin/login');
        return;
      }

      const endpoint = action === 'delete' 
        ? `http://localhost:5000/api/admin/users/${userId}`
        : `http://localhost:5000/api/admin/users/${userId}/${action}`;
      
      const method = action === 'delete' ? 'delete' : 'put';
      
      const { data } = await axios({
        method: method,
        url: endpoint,
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        data: {} // Empty object for DELETE requests
      });

      if (action === 'delete') {
        // Emit socket event for user deletion
        if (socket) {
          socket.emit('admin_deleted_user', userId);
        }
        setUsers(prev => prev.filter(user => user._id !== userId));
      } else {
        setUsers(prev => prev.map(user => 
          user._id === userId ? data : user
        ));
      }

      toast({
        title: 'Success',
        description: `User ${action === 'delete' ? 'deleted' : action === 'suspend' ? (data.isSuspended ? 'suspended' : 'unsuspended') : (data.isBlockedFromGroup ? 'blocked' : 'unblocked')} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to ${action} user`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/admin/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroupMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle clear group chat
  const handleClearGroupChat = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete('http://localhost:5000/api/admin/messages/group/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroupMessages([]);
      onClose();
      toast({
        title: 'Success',
        description: 'Group chat cleared successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to clear group chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Add function to get status color
  const getStatusColor = (user) => {
    if (user.isSuspended) return 'red.500';
    if (user.isBlockedFromGroup) return 'red.500';
    return 'green.500';
  };

  // Add function to get status text
  const getStatusText = (user) => {
    if (user.isSuspended) return 'Suspended';
    if (user.isBlockedFromGroup) return 'Blocked from Group';
    return 'Active';
  };

  if (loading) {
    return (
      <Flex height="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="gray.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" py={8}>
      <Container maxW="container.xl" h="calc(100vh - 64px)">
        <VStack spacing={8} align="stretch" h="100%">
          <Flex justify="space-between" align="center">
            <Heading color="gray.100" size="lg">Admin Dashboard</Heading>
            <Button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
              }}
              size="sm"
              colorScheme="gray"
              variant="outline"
              _hover={{ bg: 'gray.700' }}
            >
              Logout
            </Button>
          </Flex>

          <Tabs variant="soft-rounded" colorScheme="gray" h="calc(100% - 48px)">
            <Flex justify="space-between" align="center" mb={4}>
              <TabList>
                <Tab 
                  color="gray.400" 
                  _selected={{ 
                    color: 'white',
                    bg: 'gray.700'
                  }}
                  mr={2}
                  transition="all 0.2s"
                  _hover={{
                    color: 'white',
                    bg: 'gray.600'
                  }}
                >
                  Users ({users.length})
                </Tab>
                <Tab 
                  color="gray.400" 
                  _selected={{ 
                    color: 'white',
                    bg: 'gray.700'
                  }}
                  transition="all 0.2s"
                  _hover={{
                    color: 'white',
                    bg: 'gray.600'
                  }}
                >
                  Group Messages ({groupMessages.length})
                </Tab>
              </TabList>
              
              {/* Clear All Messages Button */}
              <Button
                colorScheme="red"
                variant="ghost"
                leftIcon={<WarningIcon />}
                onClick={onOpen}
                size="sm"
                visibility={groupMessages.length > 0 ? 'visible' : 'hidden'}
              >
                Clear All Messages
              </Button>
            </Flex>

            <TabPanels h="calc(100% - 48px)">
              {/* Users Panel */}
              <TabPanel p={0} h="100%">
                <Box 
                  bg="gray.800" 
                  borderRadius="lg" 
                  overflow="hidden"
                  boxShadow="xl"
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <Box 
                    overflowY="auto" 
                    overflowX="auto"
                    maxH="100%"
                    position="relative"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: 0,
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'transparent',
                      },
                      'scrollbarWidth': 'none',  // Firefox
                      '-ms-overflow-style': 'none',  // IE and Edge
                    }}
                  >
                    <Table variant="simple" minWidth="750px">
                      <Thead 
                        position="sticky"
                        top={0}
                        zIndex={1}
                        bg="gray.800"
                        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      >
                        <Tr bg="gray.900">
                          <Th 
                            color="gray.300"
                            width="25%" 
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Username
                          </Th>
                          <Th 
                            color="gray.300"
                            width="25%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Full Name
                          </Th>
                          <Th 
                            color="gray.300"
                            width="25%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Status
                          </Th>
                          <Th 
                            color="gray.300"
                            width="25%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Actions
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {users.map(user => (
                          <Tr key={user._id} _hover={{ bg: 'gray.700' }}>
                            <Td color="gray.300">@{user.username}</Td>
                            <Td color="gray.300">{user.fullName}</Td>
                            <Td>
                              <Flex gap={2} flexWrap="wrap">
                                <Badge 
                                  color={getStatusColor(user)}
                                  bg={`${getStatusColor(user)}20`}
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontWeight="medium"
                                  fontSize="xs"
                                  display="flex"
                                  alignItems="center"
                                  minW="80px"
                                  justifyContent="center"
                                >
                                  {getStatusText(user)}
                                </Badge>
                              </Flex>
                            </Td>
                            <Td>
                              <Flex gap={2} flexWrap="nowrap">
                                <Tooltip 
                                  label={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                                  placement="top"
                                >
                                  <Button
                                    size="sm"
                                    colorScheme={user.isSuspended ? "green" : "red"}
                                    variant="ghost"
                                    onClick={() => handleUserAction(user._id, 'suspend')}
                                    minW="90px"
                                  >
                                    {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                  </Button>
                                </Tooltip>
                                <Tooltip 
                                  label={user.isBlockedFromGroup ? "Unblock from Group" : "Block from Group"}
                                  placement="top"
                                >
                                  <Button
                                    size="sm"
                                    colorScheme={user.isBlockedFromGroup ? "green" : "red"}
                                    variant="ghost"
                                    onClick={() => handleUserAction(user._id, 'block-group')}
                                    minW="90px"
                                  >
                                    {user.isBlockedFromGroup ? 'Unblock' : 'Block'}
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Delete User" placement="top">
                                  <IconButton
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    icon={<DeleteIcon />}
                                    onClick={() => handleUserAction(user._id, 'delete')}
                                    aria-label="Delete user"
                                  />
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </TabPanel>

              {/* Messages Panel */}
              <TabPanel p={0} h="100%">
                <Box 
                  bg="gray.800" 
                  borderRadius="lg" 
                  overflow="hidden"
                  boxShadow="xl"
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <Box 
                    overflowY="auto"
                    overflowX="auto"
                    maxH="100%"
                    position="relative"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: 0,
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'transparent',
                      },
                      'scrollbarWidth': 'none',  // Firefox
                      '-ms-overflow-style': 'none',  // IE and Edge
                    }}
                  >
                    <Table variant="simple" minWidth="750px">
                      <Thead 
                        position="sticky"
                        top={0}
                        zIndex={1}
                        bg="gray.800"
                        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      >
                        <Tr bg="gray.900">
                          <Th 
                            color="gray.300"
                            width="25%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Sender
                          </Th>
                          <Th 
                            color="gray.300"
                            width="45%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Message
                          </Th>
                          <Th 
                            color="gray.300"
                            width="20%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Time
                          </Th>
                          <Th 
                            color="gray.300"
                            width="10%"
                            borderBottom="2px" 
                            borderColor="gray.600"
                            py={5}
                            fontSize="sm"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Actions
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {groupMessages.map(message => (
                          <Tr key={message._id} _hover={{ bg: 'gray.700' }}>
                            <Td color="gray.300">
                              <Flex align="center" gap={2}>
                                <Text fontWeight="bold">
                                  {message.sender.fullName}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  @{message.sender.username}
                                </Text>
                              </Flex>
                            </Td>
                            <Td color="gray.300" maxW="400px" isTruncated>
                              {message.content}
                            </Td>
                            <Td color="gray.300" whiteSpace="nowrap">
                              {formatDate(message.createdAt)}
                            </Td>
                            <Td>
                              <Tooltip label="Delete Message" placement="top">
                                <IconButton
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  icon={<DeleteIcon />}
                                  onClick={() => handleDeleteMessage(message._id)}
                                  aria-label="Delete message"
                                />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.100">Clear Group Chat</ModalHeader>
          <ModalBody>
            <Text color="gray.300">
              Are you sure you want to delete all group messages? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose}
              color="gray.300"
              _hover={{ bg: 'gray.700' }}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              variant="ghost"
              onClick={handleClearGroupChat}
            >
              Clear All Messages
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AdminDashboard; 