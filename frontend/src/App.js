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

// Example layout config for 16x9 grid.
// Each module defines its position (x,y) and size (w,h) in grid cells.
const layoutConfig = [
  { id: 'welcome', x: 0,  y: 0, w: 4, h: 2, title: 'Welcome', component: (
      <Typography variant="body2" color="text.secondary">
        Welcome to the Institute Dashboard – prototype 16x9 layout.
      </Typography>
    ) },
  { id: 'testBlock1', x: 4,  y: 0, w: 4, h: 2, title: 'testBlock1', component: (
      <Typography variant="caption" color="text.secondary">add content here</Typography>
    ) },
  { id: 'testBlock2', x: 8, y: 0, w: 8, h: 2, title: 'testBlock2', component: (
      <Typography variant="caption" color="text.secondary">add even more content here</Typography>
    ) },
  { id: 'antraege', x: 0, y: 2, w: 16, h: 6, title: 'Anträge', component: <Antraege /> },

  
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <img src="/IIIUS_logo.png" alt="IIIUS Logo" style={{ height: 100, width: 'auto' }} />
          <Typography variant="h4" component="h1">Dashboard</Typography>
        </Box>                                      
  <GridLayout layout={layoutConfig} gap={4} />
      </Container>
    </ThemeProvider>
  );
}

export default App;
