import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      primary: 'var(--chakra-colors-brand-primary)',
      secondary: 'var(--chakra-colors-brand-secondary)',
      light: 'var(--chakra-colors-brand-light)',
    },
    darkTheme: {
      100: '#111111',    // Main background
      200: '#1a1a1a',    // Slightly lighter - Sidebar & elements
      300: '#222222',    // Selected states & hover
      400: '#2d2d2d',    // Active states & message input
      500: '#ffffff',    // Primary text
      600: '#cccccc',    // Secondary text
    },
    status: {
      online: '#22c55e',     // Green for online status
      message: {
        bg: '#F73D93',       // Pink for unread count
        text: '#ffffff',     // White text
      }
    },
    message: {
      sent: {
        bg: '#F73D93',       // Pink for sent messages
        text: '#ffffff',     // White text
      },
      received: {
        bg: '#2d2d2d',       // Dark gray for received messages
        text: '#ffffff',     // White text
      }
    },
    button: {
      primary: '#F73D93',    // Pink for primary buttons
      secondary: '#2d2d2d',  // Dark gray for secondary buttons
      text: '#ffffff',       // White text
      hover: {
        primary: '#d42f7c',  // Darker pink for hover
        secondary: '#3d3d3d', // Lighter gray for hover
      }
    },
    sidebar: {
      bg: '#1a1a1a',         // Slightly lighter than main background
      hover: '#222222',      // Hover state
      selected: '#2d2d2d',   // Selected chat
      border: '#2d2d2d',     // Borders
    },
    input: {
      bg: '#2d2d2d',         // Input background
      hover: '#3d3d3d',      // Input hover
      focus: '#F73D93',      // Input focus
      placeholder: '#888888', // Placeholder text
    }
  },
  styles: {
    global: {
      ':root': {
        '--chakra-colors-brand-primary': '#F73D93',
        '--chakra-colors-brand-secondary': '#d42f7c',
        '--chakra-colors-brand-light': '#ff5ca0',
      },
      body: {
        bg: 'darkTheme.100',
        color: 'darkTheme.500',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'button.primary',
          color: 'button.text',
          _hover: {
            bg: 'button.hover.primary',
            transform: 'translateY(-1px)',
          },
        },
        ghost: {
          color: 'darkTheme.500',
          _hover: {
            bg: 'darkTheme.300',
          },
          _active: {
            bg: 'darkTheme.300',
          },
          _focus: {
            boxShadow: 'none',
          },
        },
        logout: {
          bg: 'button.secondary',
          color: 'button.text',
          _hover: {
            bg: 'button.hover.secondary',
            transform: 'translateY(-1px)',
          },
        }
      },
    },
    IconButton: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
      variants: {
        ghost: {
          _hover: {
            bg: 'darkTheme.300',
          },
          _active: {
            bg: 'darkTheme.300',
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'input.bg',
            border: '1px solid',
            borderColor: 'transparent',
            color: 'darkTheme.500',
            _hover: {
              bg: 'input.hover',
            },
            _focus: {
              borderColor: 'input.focus',
              bg: 'input.bg',
              boxShadow: '0 0 0 1px #F73D93',
            },
            _placeholder: {
              color: 'input.placeholder',
            },
          },
        },
      },
    },
    Box: {
      variants: {
        sidebar: {
          bg: 'sidebar.bg',
          borderRight: '1px solid',
          borderColor: 'sidebar.border',
        },
        chatHeader: {
          bg: 'darkTheme.200',
          borderBottom: '1px solid',
          borderColor: 'darkTheme.300',
        },
        chatArea: {
          bg: 'darkTheme.100',
        },
        messageInput: {
          bg: 'darkTheme.200',
          borderTop: '1px solid',
          borderColor: 'darkTheme.300',
        }
      }
    },
    Badge: {
      baseStyle: {
        bg: 'status.message.bg',
        color: 'status.message.text',
      },
    },
  },
  layerStyles: {
    selected: {
      bg: 'sidebar.selected',
      borderLeft: '2px solid',
      borderColor: 'brand.primary',
    },
    hover: {
      _hover: {
        bg: 'sidebar.hover',
        transform: 'translateY(-1px)',
      },
      transition: 'all 0.2s',
    },
    message: {
      sent: {
        bg: 'message.sent.bg',
        color: 'message.sent.text',
      },
      received: {
        bg: 'message.received.bg',
        color: 'message.received.text',
      }
    }
  },
  textStyles: {
    h1: {
      color: 'darkTheme.500',
      fontSize: ['24px', '32px'],
      fontWeight: 'bold',
    },
    h2: {
      color: 'darkTheme.500',
      fontSize: ['20px', '24px'],
      fontWeight: 'semibold',
    },
    username: {
      color: 'brand.light',
      fontWeight: 'medium',
    }
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App; 