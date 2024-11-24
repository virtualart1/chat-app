import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  InputGroup,
  InputRightElement,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !fullName || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, {
        username,
        fullName,
        password,
      });
      toast({
        title: 'Registration Successful',
        description: 'You can now login with your credentials',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box 
      minH="100vh" 
      bg="darkTheme.100" 
      py={12} 
      px={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="md">
        <Box
          bg="darkTheme.200"
          p={8}
          borderRadius="xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor="darkTheme.300"
        >
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={4}>
              <Heading size="xl" mb={2} color="white">
                Create Account
              </Heading>
              <Text color="darkTheme.500">
                Join our anonymous chat community
              </Text>
            </Box>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Full Name</FormLabel>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                size="lg"
                bg="darkTheme.300"
                border="none"
                _focus={{
                  bg: 'darkTheme.400',
                  borderColor: 'brand.primary',
                }}
                _hover={{
                  bg: 'darkTheme.400',
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                size="lg"
                bg="darkTheme.300"
                border="none"
                _focus={{
                  bg: 'darkTheme.400',
                  borderColor: 'brand.primary',
                }}
                _hover={{
                  bg: 'darkTheme.400',
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Password</FormLabel>
              <InputGroup size="lg">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  bg="darkTheme.300"
                  border="none"
                  _focus={{
                    bg: 'darkTheme.400',
                    borderColor: 'brand.primary',
                  }}
                  _hover={{
                    bg: 'darkTheme.400',
                  }}
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    color="darkTheme.500"
                    _hover={{
                      bg: 'transparent',
                      color: 'white',
                    }}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              colorScheme="purple"
              size="lg"
              width="100%"
              onClick={handleSubmit}
              isLoading={loading}
              bg="brand.primary"
              _hover={{
                bg: 'brand.secondary',
              }}
              mt={4}
            >
              Sign Up
            </Button>

            <Text textAlign="center" color="darkTheme.500">
              Already have an account?{' '}
              <ChakraLink
                as={Link}
                to="/login"
                color="brand.primary"
                _hover={{
                  color: 'brand.secondary',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

export default Register; 