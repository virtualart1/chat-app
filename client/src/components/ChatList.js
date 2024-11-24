import React from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react';

function ChatList({ users, onlineUsers, selectedUser, onSelectUser, unreadMessages }) {
  return (
    <VStack spacing={0} align="stretch" w="100%" p={3}>
      {users.map((user, index) => (
        <React.Fragment key={user._id}>
          <Box
            p={3}
            cursor="pointer"
            bg={
              selectedUser?._id === user._id 
                ? 'darkTheme.400'
                : 'darkTheme.200'
            }
            _hover={{
              bg: selectedUser?._id === user._id 
                ? 'darkTheme.400'
                : 'darkTheme.300'
            }}
            borderRadius="lg"
            onClick={() => onSelectUser(user)}
            position="relative"
            transition="all 0.2s"
            my={1.5}
          >
            <Flex align="center">
              <Box position="relative">
                <Avatar size="sm" name={user.fullName} mr={3} />
                {onlineUsers.includes(user._id) && (
                  <Box
                    position="absolute"
                    bottom="0"
                    right="12px"
                    w="8px"
                    h="8px"
                    bg="status.online"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={selectedUser?._id === user._id ? 'darkTheme.400' : 'darkTheme.200'}
                  />
                )}
              </Box>
              <Box flex="1">
                <Text fontWeight="bold" color="white">
                  {user.fullName}
                </Text>
                <Text fontSize="sm" color="darkTheme.500">
                  @{user.username}
                </Text>
              </Box>
              {unreadMessages[user._id] > 0 && (
                <Badge
                  bg="status.message.bg"
                  color="status.message.text"
                  borderRadius="full"
                  minW="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="10px"
                  fontWeight="bold"
                  px={1}
                >
                  {unreadMessages[user._id]}
                </Badge>
              )}
            </Flex>
          </Box>
          {index < users.length - 1 && (
            <Divider 
              borderColor="darkTheme.300" 
              opacity={0.5} 
              mx={3}
              my={1}
              borderWidth="1px"
            />
          )}
        </React.Fragment>
      ))}
    </VStack>
  );
}

export default ChatList; 