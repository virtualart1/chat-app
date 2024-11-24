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
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
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
      const { data } = await axios.post('http://localhost:5000/api/users/login', {
        username,
        password,
      });
      login(data);
      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/chat');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid credentials',
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
                Welcome Back
              </Heading>
              <Text color="darkTheme.500">
                Enter your credentials to access your account
              </Text>
            </Box>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                  placeholder="Enter your password"
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
              Sign In
            </Button>

            <Text textAlign="center" color="darkTheme.500">
              Don't have an account?{' '}
              <ChakraLink
                as={Link}
                to="/register"
                color="brand.primary"
                _hover={{
                  color: 'brand.secondary',
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

export default Login; 