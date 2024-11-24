import React from 'react';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

const themeColors = [
  { name: 'Pink', value: '#F73D93' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Violet', value: '#7C3AED' }
];

function ColorPicker({ onColorChange, currentColor }) {
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Theme options"
        icon={<SettingsIcon />}
        variant="ghost"
        size="sm"
        _hover={{ bg: 'darkTheme.300' }}
      />
      <MenuList bg="darkTheme.200" borderColor="darkTheme.300">
        <Box p={2} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          {themeColors.map((color) => (
            <MenuItem
              key={color.value}
              onClick={() => onColorChange(color.value)}
              p={0}
              m={1}
              bg="transparent"
              _hover={{ bg: 'transparent' }}
            >
              <Box
                w="8"
                h="8"
                bg={color.value}
                borderRadius="md"
                cursor="pointer"
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.1)' }}
                border="2px solid"
                borderColor={currentColor === color.value ? 'white' : 'transparent'}
              />
            </MenuItem>
          ))}
        </Box>
      </MenuList>
    </Menu>
  );
}

export default ColorPicker; 