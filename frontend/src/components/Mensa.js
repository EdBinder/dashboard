import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import NatureIcon from '@mui/icons-material/Nature';

const API_BASE_URL = 'http://localhost:8000/api';
const REFRESH_INTERVAL = 120000; // 120 seconds

export default function Mensa() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch menu data from Laravel backend
  const fetchMenuData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/mensa`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden des Speiseplans');
      }
      
      setMenuData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err.message || 'Fehler beim Laden des Speiseplans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchMenuData(true);
  }, [fetchMenuData]);

  // Set up auto-refresh interval
  useEffect(() => {
    fetchMenuData(true);

    const interval = setInterval(() => {
      fetchMenuData(false); // Don't show spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchMenuData]);

  // Get icon based on menu type
  const getMenuIcon = (art, zusatz) => {
    if (zusatz?.includes('vegan')) {
      return <NatureIcon color="success" fontSize="small" />;
    }
    if (zusatz?.includes('vegetarisch')) {
      return <LocalDiningIcon color="primary" fontSize="small" />;
    }
    return <RestaurantIcon color="action" fontSize="small" />;
  };

  // Get chip color based on menu type
  const getMenuChipColor = (zusatz) => {
    if (zusatz?.includes('vegan')) {
      return 'success';
    }
    if (zusatz?.includes('vegetarisch')) {
      return 'primary';
    }
    return 'default';
  };

  // Get day label
  const getDayLabel = (day) => {
    if (day.is_today) return 'Heute';
    if (day.is_tomorrow) return 'Morgen';
    return day.weekday;
  };

  if (loading && !menuData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !menuData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon color="primary" />
          <Typography variant="h6" component="h2">
            {menuData?.mensa_name || 'Mensa Speiseplan'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          )}
          <Tooltip title="Aktualisieren">
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading}
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Days */}
      {menuData?.days?.length > 0 ? (
        <Stack spacing={3}>
          {menuData.days.map((day, dayIndex) => (
            <Box key={dayIndex}>
              {/* Day Header */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6" component="h3">
                  {getDayLabel(day)} - {day.weekday}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {new Date(day.datum_formatted).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Paper>

              {/* Menu Items for this day */}
              <Grid container spacing={2}>
                {day.menues?.length > 0 ? (
                  day.menues.map((menue, menueIndex) => (
                    <Grid item xs={12} md={6} key={menueIndex}>
                      <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            {getMenuIcon(menue.art, menue.zusatz)}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                {menue.art}
                              </Typography>
                              {menue.zusatz && (
                                <Chip
                                  label={menue.zusatz}
                                  size="small"
                                  color={getMenuChipColor(menue.zusatz)}
                                  sx={{ mb: 1 }}
                                />
                              )}
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.4 }}>
                            {menue.name}
                          </Typography>

                          {/* Prices */}
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Studierende: <strong>{menue.preise.studierende}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Angestellte: <strong>{menue.preise.angestellte}</strong>
                            </Typography>
                          </Stack>

                          {/* Allergenes and additives */}
                          {(menue.allergene || menue.kennzeichnungen) && (
                            <>
                              <Divider sx={{ my: 1 }} />
                              {menue.allergene && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  <strong>Allergene:</strong> {menue.allergene}
                                </Typography>
                              )}
                              {menue.kennzeichnungen && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  <strong>Zusatzstoffe:</strong> {menue.kennzeichnungen}
                                </Typography>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Keine Speisen für {getDayLabel(day)} verfügbar.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))}
        </Stack>
      ) : (
        <Alert severity="info">
          Keine Speiseplan-Daten verfügbar.
        </Alert>
      )}
    </Box>
  );
}