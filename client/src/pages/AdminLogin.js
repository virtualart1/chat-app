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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
        email,
        password,
      });
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
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
                Admin Login
              </Heading>
              <Text color="darkTheme.500">
                Access admin dashboard
              </Text>
            </Box>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                size="lg"
                bg="darkTheme.300"
                border="none"
                _focus={{
                  bg: 'darkTheme.400',
                  borderColor: 'brand.primary',
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="darkTheme.500">Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                size="lg"
                bg="darkTheme.300"
                border="none"
                _focus={{
                  bg: 'darkTheme.400',
                  borderColor: 'brand.primary',
                }}
              />
            </FormControl>

            <Button
              colorScheme="red"
              size="lg"
              width="100%"
              onClick={handleSubmit}
              isLoading={loading}
              mt={4}
            >
              Login as Admin
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

export default AdminLogin; 