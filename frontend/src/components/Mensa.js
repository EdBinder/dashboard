import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import NatureIcon from '@mui/icons-material/Nature';
import EuroIcon from '@mui/icons-material/Euro';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Mensa() {
  const theme = useTheme();
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu data from Laravel backend
  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/mensa/with-images`, {
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
    fetchMenuData();
  }, [fetchMenuData]);

  // Initial load
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Get chip color and icon based on menu type
  const getMenuTypeInfo = (zusatz) => {
    if (zusatz?.includes('vegan')) {
      return { 
        color: 'success', 
        icon: <NatureIcon sx={{ fontSize: '0.9rem' }} />,
        bgColor: theme.palette.success.light + '20',
        isVegetarian: false,
        isVegan: true
      };
    }
    if (zusatz?.includes('vegetarisch')) {
      return { 
        color: 'primary', 
        icon: <LocalDiningIcon sx={{ fontSize: '0.9rem' }} />,
        bgColor: theme.palette.primary.light + '20',
        isVegetarian: true,
        isVegan: false
      };
    }
    return { 
      color: 'default', 
      icon: <RestaurantIcon sx={{ fontSize: '0.9rem' }} />,
      bgColor: theme.palette.grey[100],
      isVegetarian: false,
      isVegan: false
    };
  };

  // Get the first day (today) and second day (tomorrow) with menu data
  const todayData = menuData?.days?.[0];
  const tomorrowData = menuData?.days?.[1];
  const todayMenus = todayData?.menues || [];
  const tomorrowMenus = tomorrowData?.menues || [];

  // Get day label
  const getDayLabel = (day) => {
    if (!day) return '';
    if (day.is_today) return 'Heute';
    if (day.is_tomorrow) return 'Morgen';
    return day.weekday;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
          borderRadius: 2
        }}
      >
        <CircularProgress size={32} thickness={4} />
        <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
          Lade Speiseplan...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          fontSize: '0.75rem',
          borderRadius: 2,
          '& .MuiAlert-icon': { fontSize: '1rem' }
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 1.5,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Mensa
          </Typography>
        </Box>
        <IconButton 
          onClick={handleRefresh} 
          disabled={loading}
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content - Today gets 3/4, Tomorrow gets 1/4 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Side - Today (3/4 width) */}
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${theme.palette.divider}`, minHeight: 0 }}>
          {/* Today Header */}
          <Box sx={{ 
            p: 1.4, 
            backgroundColor: theme.palette.primary.light + '20',
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1rem' }}>
              {getDayLabel(todayData) || 'Heute'}
            </Typography>
          </Box>
          
          {/* Today Menu List with Images */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 1, minHeight: 0 }}>
            {todayMenus.length > 0 ? (
              <List dense sx={{ py: 0, height: '100%' }}>
                {todayMenus.map((menue, index) => {
                  const typeInfo = getMenuTypeInfo(menue.zusatz);
                  return (
                    <ListItem key={index} sx={{ px: 0, py: 0.5, display: 'block' }}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          width: '100%',
                          backgroundColor: typeInfo.bgColor,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: theme.shadows[2]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 1.4, '&:last-child': { pb: 1.4 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            {/* Food Image */}
                            <Box sx={{ flexShrink: 0 }}>
                              {menue.image?.url ? (
                                <Box sx={{ 
                                  width: 80,
                                  height: 80,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  border: `2px solid ${theme.palette.divider}`,
                                  position: 'relative',
                                  background: theme.palette.grey[100]
                                }}>
                                  <img 
                                    src={menue.image.url}
                                    alt={menue.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      transition: 'transform 0.2s ease'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <Box sx={{
                                    display: 'none',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: theme.palette.grey[200]
                                  }}>
                                    <RestaurantIcon sx={{ fontSize: '2rem', color: theme.palette.grey[400] }} />
                                  </Box>
                                </Box>
                              ) : (
                                <Box sx={{ 
                                  width: 80,
                                  height: 80,
                                  borderRadius: 2,
                                  border: `2px solid ${theme.palette.divider}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: theme.palette.grey[200]
                                }}>
                                  <RestaurantIcon sx={{ fontSize: '2rem', color: theme.palette.grey[400] }} />
                                </Box>
                              )}
                            </Box>

                            {/* Menu Info */}
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Box sx={{ position: 'relative' }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.background.paper,
                                    boxShadow: theme.shadows[1],
                                    flexShrink: 0
                                  }}>
                                    {React.cloneElement(typeInfo.icon, { sx: { fontSize: '0.9rem' } })}
                                  </Box>
                                  {typeInfo.isVegetarian && (
                                    <Box sx={{ 
                                      position: 'absolute',
                                      bottom: -4,
                                      right: -4,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      backgroundColor: theme.palette.success.main,
                                      boxShadow: theme.shadows[1]
                                    }}>
                                      <NatureIcon sx={{ fontSize: '0.6rem', color: 'white' }} />
                                    </Box>
                                  )}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: '0.95rem', 
                                      lineHeight: 1.4,
                                      color: theme.palette.text.primary,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {menue.name}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Additional info like allergens could go here */}
                              {menue.allergene && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.7rem',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {menue.allergene}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <RestaurantIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Keine Speisen
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Side - Tomorrow (1/4 width, compact) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Tomorrow Header */}
          <Box sx={{ 
            p: 1.65, 
            backgroundColor: theme.palette.secondary.light + '20',
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.secondary.main, fontSize: '0.85rem' }}>
              {getDayLabel(tomorrowData) || 'Morgen'}
            </Typography>
          </Box>
          
          {/* Tomorrow Menu List (Compact) */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 0.5, minHeight: 0 }}>
            {tomorrowMenus.length > 0 ? (
              <List dense sx={{ py: 0, height: '100%' }}>
                {tomorrowMenus.map((menue, index) => {
                  const typeInfo = getMenuTypeInfo(menue.zusatz);
                  return (
                    <ListItem key={index} sx={{ px: 0, py: 0.3, display: 'block' }}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          width: '100%',
                          backgroundColor: typeInfo.bgColor,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: theme.shadows[1]
                          }
                        }}
                      >
                        <CardContent sx={{ p: 0.8, '&:last-child': { pb: 0.8 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: theme.palette.background.paper,
                              boxShadow: theme.shadows[1],
                              flexShrink: 0
                            }}>
                              {React.cloneElement(typeInfo.icon, { sx: { fontSize: '0.7rem' } })}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500, 
                                  fontSize: '0.75rem', 
                                  lineHeight: 1.2,
                                  color: theme.palette.text.primary,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {menue.name}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <RestaurantIcon sx={{ fontSize: '1.5rem', color: 'text.disabled', mb: 0.3 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '1rem' }}>
                  Keine Speisen
                </Typography>
              </Box>
            )}D
          </Box>
        </Box>
      </Box>
    </Box>
  );
}