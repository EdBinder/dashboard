import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';

const API_BASE_URL = 'http://localhost:8000/api';
const REFRESH_INTERVAL = 120000; // 120 seconds

export default function Antraege() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Fetch proposals data from backend
  const fetchProposals = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/proposals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.parsing_result?.data) {
        setData(result.parsing_result.data);
        setLastUpdated(new Date());
        console.log('Proposals data updated:', result.parsing_result.data.length, 'records');
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up auto-refresh timer
  useEffect(() => {
    // Initial fetch
    fetchProposals();

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchProposals(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    setRefreshTimer(interval);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchProposals]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchProposals(true);
  };

  // Get status icon based on proposal status
  const getStatusIcon = (status) => {
    if (!status) return <PendingIcon color="disabled" fontSize="small" />;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('eingereicht') || statusLower.includes('submitted')) {
      return <CheckCircleIcon color="success" fontSize="small" />;
    }
    if (statusLower.includes('abgelehnt') || statusLower.includes('rejected')) {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    return <PendingIcon color="warning" fontSize="small" />;
  };

  // Format priority display
  const formatPriority = (priority) => {
    if (!priority) return '-';
    const numPriority = parseInt(priority);
    if (!isNaN(numPriority)) {
      const color = numPriority <= 2 ? 'error' : numPriority <= 4 ? 'warning' : 'default';
      return <Chip label={priority} size="small" color={color} />;
    }
    return priority;
  };

  // Format funding amount
  const formatFunding = (amount) => {
    if (!amount) return '-';
    // Try to extract numbers and format as currency
    const numbers = amount.match(/[\d,\.]+/);
    if (numbers) {
      const num = parseFloat(numbers[0].replace(/,/g, ''));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('de-DE', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0
        }).format(num);
      }
    }
    return amount;
  };

  // Format deadline to be more compact
  const formatDeadline = (deadline) => {
    if (!deadline) return '-';
    
    // Try to extract date patterns and make them more compact
    const datePattern = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/;
    const match = deadline.match(datePattern);
    
    if (match) {
      const [, day, month, year] = match;
      const shortYear = year.length === 4 ? year.slice(-2) : year;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${shortYear}`;
    }
    
    // If no date pattern found, truncate to first 10 chars
    return deadline.length > 10 ? deadline.substring(0, 10) + '...' : deadline;
  };

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Lade Anträge...
        </Typography>
      </Box>
    );
  }

  if (error && data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Fehler beim Laden der Anträge: {error}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleManualRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with refresh button and status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {data.length} Anträge
          {lastUpdated && (
            <span> • Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE')}</span>
          )}
        </Typography>
        <Tooltip title="Manuell aktualisieren">
          <IconButton 
            size="small" 
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error banner if there's an error but we have cached data */}
      {error && data.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
          <Typography variant="caption">
            Aktualisierung fehlgeschlagen: {error}
          </Typography>
        </Alert>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ height: '100%', boxShadow: 'none' }}>
          <Table 
            stickyHeader 
            size="small"
            sx={{ 
              tableLayout: 'fixed',
              width: '100%',
              '& .MuiTableCell-root': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          >
            <colgroup>
              <col style={{ width: '5%' }} /> {/* Status */}
              <col style={{ width: '5%' }} /> {/* Priorität */}
              <col style={{ width: '47%' }} /> {/* Ausschreibung */}
              <col style={{ width: '10%' }} /> {/* Fördervolumen */}
              <col style={{ width: '12%' }} /> {/* Deadline */}
              <col style={{ width: '21%' }} /> {/* Themen */}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priorität</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ausschreibung</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fördervolumen</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Deadline</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Themen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((proposal, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getStatusIcon(proposal.Status)}
                      <Typography variant="caption" noWrap>
                        {proposal['Eingereicht?'] || '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatPriority(proposal.Priorität)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {proposal.Ausschreibungen || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {formatFunding(proposal['Fördervolumen in €'])}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={proposal['Fristen / Deadline'] || '-'}>
                      {formatDeadline(proposal['Fristen / Deadline'])}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" noWrap>
                      {proposal.Themen || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Keine Anträge verfügbar
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {loading && (
        <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
          <CircularProgress size={16} />
        </Box>
      )}
    </Box>
  );
}