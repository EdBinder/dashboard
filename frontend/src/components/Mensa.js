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
  Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import NatureIcon from '@mui/icons-material/Nature';

const MENSA_API_URL = 'https://www.swfr.de/apispeiseplan?&type=98&tx_speiseplan_pi1%5BapiKey%5D=' + process.env.REACT_APP_SWFR_API_KEY + '&tx_speiseplan_pi1%5Btage%5D=1&tx_speiseplan_pi1%5Bort%5D=610';
const REFRESH_INTERVAL = 120000; // 120 seconds

export default function Mensa() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Parse XML response to extract menu data
  const parseMenuData = (xmlText) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const mensaName = xmlDoc.querySelector('mensa')?.textContent || 'Mensa Rempartstraße';
      const datum = xmlDoc.querySelector('tagesplan')?.getAttribute('datum') || new Date().toLocaleDateString('de-DE');
      
      const menues = Array.from(xmlDoc.querySelectorAll('menue')).map(menue => {
        const name = menue.querySelector('name')?.textContent || '';
        const art = menue.getAttribute('art') || '';
        const zusatz = menue.getAttribute('zusatz') || '';
        const allergene = menue.querySelector('allergene')?.textContent || '';
        const kennzeichnungen = menue.querySelector('kennzeichnungen')?.textContent || '';
        
        const preise = {
          studierende: menue.querySelector('preis studierende')?.textContent || '',
          angestellte: menue.querySelector('preis angestellte')?.textContent || '',
          gaeste: menue.querySelector('preis gaeste')?.textContent || '',
          schueler: menue.querySelector('preis schueler')?.textContent || ''
        };

        return {
          art,
          name: name.replace(/Ã¤/g, 'ä').replace(/Ã¼/g, 'ü').replace(/Ã¶/g, 'ö').replace(/ÃŸ/g, 'ß').replace(/Ã€/g, 'Ä').replace(/Ã‡/g, 'Ü').replace(/Ã–/g, 'Ö'),
          zusatz,
          allergene,
          kennzeichnungen,
          preise
        };
      });

      return {
        mensaName: mensaName.replace(/Ã¤/g, 'ä').replace(/Ã¼/g, 'ü').replace(/Ã¶/g, 'ö').replace(/ÃŸ/g, 'ß'),
        datum,
        menues
      };
    } catch (err) {
      console.error('Error parsing XML:', err);
      throw new Error('Fehler beim Verarbeiten der Speiseplan-Daten');
    }
  };

  // Fetch menu data from Mensa API
  const fetchMenuData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(MENSA_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parsedData = parseMenuData(xmlText);
      
      setMenuData(parsedData);
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

  if (loading && !menuData.menues?.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !menuData.menues?.length) {
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
            {menuData.mensaName || 'Mensa Speiseplan'}
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

      {/* Date */}
      {menuData.datum && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {new Date(menuData.datum.split('.').reverse().join('-')).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Menu Items */}
      <Grid container spacing={2}>
        {menuData.menues?.length > 0 ? (
          menuData.menues.map((menue, index) => (
            <Grid item xs={12} md={6} key={index}>
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
              Keine Speiseplan-Daten verfügbar.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}