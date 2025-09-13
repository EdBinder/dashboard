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
  { id: 'welcome', x: 0,  y: 0, w: 6, h: 2, title: 'Welcome', component: (
      <Typography variant="body2" color="text.secondary">
        Welcome to the Institute Dashboard – prototype 16x9 layout.
      </Typography>
    ) },
  { id: 'summary', x: 6,  y: 0, w: 5, h: 2, title: 'Summary', component: (
      <Typography variant="caption" color="text.secondary">Add KPIs here.</Typography>
    ) },
  { id: 'alerts', x: 11, y: 0, w: 5, h: 2, title: 'Alerts', component: (
      <Typography variant="caption" color="text.secondary">No alerts.</Typography>
    ) },
  { id: 'mainChart', x: 0,  y: 2, w: 10, h: 4, title: 'Main Chart Area', component: (
      <Box sx={{ height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color:'text.disabled' }}>
        Chart Placeholder
      </Box>
    ) },
  { id: 'sidePanel', x: 10, y: 2, w: 6, h: 3, title: 'Side Panel', component: (
      <Typography variant="caption" color="text.secondary">Secondary content.</Typography>
    ) },
  { id: 'log', x: 10, y: 5, w: 6, h: 3, title: 'Activity Log', component: (
      <Typography variant="caption" color="text.secondary">Recent activity will appear here.</Typography>
    ) },
  { id: 'footer', x: 0,  y: 6, w: 10, h: 3, title: 'Long Module', component: (
      <Typography variant="caption" color="text.secondary">Expandable content block.</Typography>
    ) },
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
