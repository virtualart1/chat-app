import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@chakra-ui/react';

export const useCustomTheme = () => {
  // Initialize with saved color or default
  const [primaryColor, setPrimaryColor] = useState(() => {
    const savedColor = localStorage.getItem('userThemeColor');
    return savedColor || '#F73D93';
  });
  
  const theme = useTheme();

  const adjustColorBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = ((num >> 16) + amt);
    const G = (((num >> 8) & 0x00FF) + amt);
    const B = ((num & 0x0000FF) + amt);
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
  };

  // Apply theme colors on mount and color change
  const applyThemeColors = useCallback((color) => {
    theme.colors.brand.primary = color;
    theme.colors.brand.secondary = adjustColorBrightness(color, -20);
    theme.colors.brand.light = adjustColorBrightness(color, 20);
    theme.colors.status.message.bg = color;
    theme.colors.message.sent.bg = color;
    theme.colors.button.primary = color;
    theme.colors.button.hover.primary = adjustColorBrightness(color, -20);
    theme.colors.input.focus = color;

    // Update CSS variables for theme colors
    document.documentElement.style.setProperty('--chakra-colors-brand-primary', color);
    document.documentElement.style.setProperty('--chakra-colors-brand-secondary', adjustColorBrightness(color, -20));
    document.documentElement.style.setProperty('--chakra-colors-brand-light', adjustColorBrightness(color, 20));
    document.documentElement.style.setProperty('--chakra-colors-status-message-bg', color);
    document.documentElement.style.setProperty('--chakra-colors-message-sent-bg', color);
    document.documentElement.style.setProperty('--chakra-colors-button-primary', color);
    document.documentElement.style.setProperty('--chakra-colors-button-hover-primary', adjustColorBrightness(color, -20));
    document.documentElement.style.setProperty('--chakra-colors-input-focus', color);

    // Update scrollbar colors
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-scroll::-webkit-scrollbar-thumb {
        background: ${color} !important;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover {
        background: ${adjustColorBrightness(color, -20)} !important;
      }
      .sidebar-scroll {
        scrollbar-color: ${color} #111111 !important;
      }
    `;
    
    // Remove any previous dynamic scrollbar styles
    const prevStyle = document.getElementById('dynamic-scrollbar-style');
    if (prevStyle) {
      prevStyle.remove();
    }
    
    // Add the new style
    style.id = 'dynamic-scrollbar-style';
    document.head.appendChild(style);

  }, [theme.colors]);

  // Apply saved color on mount
  useEffect(() => {
    applyThemeColors(primaryColor);
  }, [applyThemeColors, primaryColor]);

  const handleColorChange = useCallback((color) => {
    setPrimaryColor(color);
    localStorage.setItem('userThemeColor', color); // Save to localStorage
    applyThemeColors(color);
  }, [applyThemeColors]);

  return { primaryColor, handleColorChange };
}; 