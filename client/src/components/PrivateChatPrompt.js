import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Avatar,
  Flex,
  Box,
} from '@chakra-ui/react';

function PrivateChatPrompt({ isOpen, onClose, user, onStartPrivateChat }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay 
        bg="blackAlpha.700" 
        backdropFilter="blur(5px)"
      />
      <ModalContent
        bg="darkTheme.200"
        borderColor="darkTheme.300"
        borderWidth="1px"
        mx={4}
      >
        <ModalHeader 
          color="darkTheme.500"
          borderBottom="1px solid"
          borderColor="darkTheme.300"
        >
          Start Private Chat
        </ModalHeader>
        <ModalBody py={6}>
          <Flex align="center" gap={4}>
            <Avatar 
              size="lg" 
              name={user?.fullName}
              bg="brand.primary"
            />
            <Box>
              <Text 
                fontSize="lg" 
                fontWeight="bold" 
                color="darkTheme.500"
              >
                {user?.fullName}
              </Text>
              <Text 
                fontSize="sm" 
                color="darkTheme.600"
              >
                @{user?.username}
              </Text>
            </Box>
          </Flex>
          <Text 
            mt={4} 
            color="darkTheme.500"
            fontSize="md"
          >
            Would you like to start a private chat with {user?.fullName}?
          </Text>
        </ModalBody>
        <ModalFooter 
          borderTop="1px solid"
          borderColor="darkTheme.300"
          gap={3}
        >
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            bg="brand.primary"
            _hover={{ bg: 'brand.secondary' }}
            onClick={() => {
              onStartPrivateChat(user);
              onClose();
            }}
            leftIcon={
              <Box as="span" fontSize="1.2em">
                💬
              </Box>
            }
          >
            Chat Privately
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default PrivateChatPrompt; 