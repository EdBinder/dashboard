import React from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Grid,
  Paper,
  Typography,
  Box,
} from "@mui/material";

// Create a simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 2, 
            mb: 3 
          }}
        >
          <img
            src="/IIIUS_logo.png"
            alt="IIIUS Logo"
            style={{ height: "100px", width: "auto" }}
          />
          <Typography variant="h3" component="h1">
            Dashboard
          </Typography>
        </Box>

        {/* Main Grid Layout */}
        <Grid container spacing={3}>
          {/* Header Row */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <></>
              <Typography variant="h5">
                Welcome to the Institute Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This is a grid-based modular dashboard
              </Typography>
            </Paper>
          </Grid>

          {/* First Row - 3 equal columns */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 200 }}>
              <Typography variant="h6">Module Slot 1</Typography>
             
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 200 }}>
              <Typography variant="h6">Module Slot 2</Typography>
              
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 200 }}>
              <Typography variant="h6">Module Slot 3</Typography>
             
            </Paper>
          </Grid>

          {/* Second Row - 2 columns */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 300 }}>
              <Typography variant="h6">Large Module Slot</Typography>
              
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 300 }}>
              <Typography variant="h6">Side Module</Typography>
              
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
