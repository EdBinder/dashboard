import React from "react";
// Font imports (only required weights to reduce bundle). Adjust as needed.
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Box,
} from "@mui/material";
import GridLayout from './components/GridLayout';
import Antraege from './components/Antraege';
import Mensa from './components/Mensa';

// Create a simple theme with global Poppins typography
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#f5f5f5" },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  }
});


// Each module defines its position (x,y) and size (w,h) in grid cells.
const layoutConfig = [
  { id: 'welcome', x: 0,  y: 0, w:6, h: 4, title: '', component: (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        height: '100%',
        justifyContent: 'center'
      }}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            // Breathing animation - scale in/out (more subtle)
            animation: 'breathe 4s ease-in-out infinite',
            // Hover effects
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0 8px 16px rgba(25, 118, 210, 0.3))',
            },
            // Define keyframe animation for breathing (more subtle)
            '@keyframes breathe': {
              '0%, 100%': {
                transform: 'scale(1)',
              },
              '50%': {
                transform: 'scale(1.02)',
              },
            },
            // Subtle glow effect that pulses in sync
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: -1,
              animation: 'pulse 4s ease-in-out infinite',
            },
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 0.3,
                transform: 'translate(-50%, -50%) scale(1)',
              },
              '50%': {
                opacity: 0.5,
                transform: 'translate(-50%, -50%) scale(1.05)',
              },
            },
          }}
        >
          <img 
            src="/IIIUS_logo.png" 
            alt="IIIUS Logo" 
            style={{ 
              height: 245, 
              width: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              transition: 'filter 0.3s ease'
            }} 
          />
        </Box>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          textAlign="center"
          sx={{
            opacity: 0,
            transform: 'translateY(20px)',
            animation: 'fadeInUp 1s ease-out 0.5s forwards',
            fontSize: '1.1rem',
            lineHeight: 1.5,
            '@keyframes fadeInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
            // Style for pulsing strong elements (synchronized with logo)
            '& strong': {
              animation: 'textPulse 4s ease-in-out infinite',
              transition: 'color 0.3s ease',
            },
            '@keyframes textPulse': {
              '0%, 100%': {
                color: 'inherit',
                textShadow: 'none',
              },
              '50%': {
                color: '#1976d2',
                textShadow: '0 0 6px rgba(25, 118, 210, 0.3)',
              },
            },
          }}
        >
          <strong>IIIUS - </strong> <strong>I</strong>nstitut für  <strong>I</strong>ntelligente und  <strong>I</strong>nteraktive  <strong>U</strong>biquitäre  <strong>S</strong>ysteme<br/>
        </Typography>
      </Box>
    ) },
 
  { id: 'antraege', x: 0, y:4, w: 16, h: 5, title: 'Anträge', component: <Antraege /> },
  { id: 'mensa', x: 6, y: 0, w: 10, h: 4, title: '', component: <Mensa /> },

  
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2, // Small padding around the entire viewport
        boxSizing: 'border-box'
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '100vw',
          height: 'calc(100vh - 32px)', // Full height minus padding
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GridLayout layout={layoutConfig} gap={4} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
