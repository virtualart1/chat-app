import React from 'react';
import {
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  Box,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';

function Disclaimer() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton
        icon={<InfoOutlineIcon />}
        variant="ghost"
        size="sm"
        aria-label="Disclaimer"
        color="darkTheme.500"
        _hover={{ bg: 'darkTheme.300' }}
        onClick={onOpen}
      />

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
        <ModalContent
          bg="darkTheme.200"
          borderColor="darkTheme.300"
          borderWidth="1px"
          mx={4}
        >
          <ModalHeader color="darkTheme.500">
            Important Disclaimer
          </ModalHeader>
          <ModalCloseButton color="darkTheme.500" />
          <ModalBody pb={6}>
            <Box>
              <Text color="darkTheme.500" mb={4}>
                This chat application prioritizes user anonymity and does not verify the real-world identity of its users.
              </Text>
              <Text color="darkTheme.500" mb={4}>
                Please be aware that:
              </Text>
              <Box pl={4} color="darkTheme.500">
                <Text mb={2}>• User profiles and names may not represent real identities</Text>
                <Text mb={2}>• Exercise caution when sharing personal information</Text>
                <Text mb={2}>• The platform maintains user privacy by design</Text>
                <Text>• All interactions should be approached with appropriate discretion</Text>
              </Box>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default Disclaimer; 