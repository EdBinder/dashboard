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

// Example layout config for 16x9 grid.
// Each module defines its position (x,y) and size (w,h) in grid cells.
const layoutConfig = [
  { id: 'welcome', x: 0,  y: 0, w:6, h: 4, title: '', component: (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <img src="/IIIUS_logo.png" alt="IIIUS Logo" style={{ height: 200, width: 'auto' }} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          <strong>IIIUS - </strong> <strong>I</strong>nstitut für  <strong>I</strong>ntelligente und  <strong>I</strong>nteraktive  <strong>U</strong>biquitäre  <strong>S</strong>ysteme<br/>

        </Typography>
      </Box>
    ) },
 
  { id: 'antraege', x: 0, y:4, w: 16, h: 5, title: 'Anträge', component: <Antraege /> },
  { id: 'mensa', x: 6, y: 0, w: 10, h: 4, title: 'Mensa Speiseplan', component: <Mensa /> },

  
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
                                        
  <GridLayout layout={layoutConfig} gap={4} />
      </Container>
    </ThemeProvider>
  );
}

export default App;
