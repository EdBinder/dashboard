import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FolderIcon from '@mui/icons-material/Folder';

const API_BASE_URL = 'http://localhost:8000/api';
const REFRESH_INTERVAL = 1200000; // 20 minutes

export default function Tasks() {
  const theme = useTheme();
  const [tasksData, setTasksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch tasks data from Laravel backend
  const fetchTasksData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
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
        throw new Error(result.error || 'Fehler beim Laden der Aufgaben');
      }
      
      setTasksData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
      setError(err.message || 'Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  // Initial load and interval setup
  useEffect(() => {
    fetchTasksData();

    // Set up automatic refresh
    const intervalId = setInterval(() => {
      fetchTasksData(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchTasksData]);

  // Get priority color based on labels or due date
  const getPriorityInfo = (card) => {
    const labels = card.labels || [];
    const duedate = card.duedate;
    
    // Check for priority labels
    const highPriorityLabel = labels.find(label => 
      label.title?.toLowerCase().includes('high') || 
      label.title?.toLowerCase().includes('urgent') ||
      label.title?.toLowerCase().includes('wichtig')
    );
    
    const lowPriorityLabel = labels.find(label => 
      label.title?.toLowerCase().includes('low') || 
      label.title?.toLowerCase().includes('niedrig')
    );

    if (highPriorityLabel) {
      return { color: 'error', level: 'Hoch' };
    }
    
    if (lowPriorityLabel) {
      return { color: 'success', level: 'Niedrig' };
    }

    // Check due date for urgency
    if (duedate) {
      const due = new Date(duedate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { color: 'error', level: 'Überfällig' };
      } else if (diffDays <= 3) {
        return { color: 'warning', level: 'Dringend' };
      }
    }
    
    return { color: 'default', level: 'Normal' };
  };

  // Format due date
  const formatDueDate = (duedate) => {
    if (!duedate) return null;
    
    const due = new Date(duedate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    const dateStr = due.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
    
    if (diffDays < 0) {
      return { text: `${dateStr} (${Math.abs(diffDays)}d überfällig)`, color: 'error' };
    } else if (diffDays === 0) {
      return { text: `${dateStr} (heute)`, color: 'warning' };
    } else if (diffDays === 1) {
      return { text: `${dateStr} (morgen)`, color: 'warning' };
    } else if (diffDays <= 7) {
      return { text: `${dateStr} (in ${diffDays}d)`, color: 'info' };
    }
    
    return { text: dateStr, color: 'default' };
  };

  // Get all tasks in a flat array for display
  const getAllTasks = () => {
    if (!tasksData?.boards) return [];
    
    const allTasks = [];
    tasksData.boards.forEach(board => {
      board.stacks?.forEach(stack => {
        stack.cards?.forEach(card => {
          if (!card.archived && !card.done) { // Only show active tasks
            allTasks.push({
              ...card,
              boardTitle: board.title || `Board ${board.id}`,
              stackTitle: stack.title,
              boardId: board.id,
              stackId: stack.id
            });
          }
        });
      });
    });
    
    // Sort by due date (urgent first), then by priority
    return allTasks.sort((a, b) => {
      const aDue = a.duedate ? new Date(a.duedate) : null;
      const bDue = b.duedate ? new Date(b.duedate) : null;
      const now = new Date();
      
      // Overdue tasks first
      if (aDue && aDue < now && (!bDue || bDue >= now)) return -1;
      if (bDue && bDue < now && (!aDue || aDue >= now)) return 1;
      
      // Then by due date (earliest first)
      if (aDue && bDue) {
        return aDue - bDue;
      }
      if (aDue && !bDue) return -1;
      if (bDue && !aDue) return 1;
      
      // Finally by creation date (newest first)
      const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bCreated - aCreated;
    });
  };

  if (loading && !tasksData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#0459C9' }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Lade Aufgaben...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          pb: 1.5,
          borderBottom: '2px solid #e2e8f0'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0459C9' }}>
            <TaskIcon sx={{ fontSize: '1.5rem' }} />
            Aufgaben
          </Typography>
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            size="small"
            sx={{ 
              color: '#0459C9',
              '&:hover': { bgcolor: '#9BB8D9' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#f56565' }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const tasks = getAllTasks();
  const activeTasks = tasks.filter(task => !task.done && !task.archived);
  const completedTasks = tasks.filter(task => task.done);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        pb: 1.5,
        borderBottom: '2px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TaskIcon sx={{ color: '#0459C9', fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ color: '#0459C9', fontWeight: 600 }}>
            Aufgaben
          </Typography>
          <Chip 
            label={`${activeTasks.length} aktiv`} 
            size="small" 
            sx={{ 
              bgcolor: '#9BB8D9', 
              color: '#0459C9',
              fontWeight: 500,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading} 
            size="small"
            sx={{ 
              color: '#0459C9',
              '&:hover': { bgcolor: '#9BB8D9', transform: 'rotate(180deg)' },
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Tasks List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {activeTasks.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '200px',
            gap: 2,
            color: 'text.secondary'
          }}>
            <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="body1">
              Keine aktiven Aufgaben
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activeTasks.slice(0, 10).map((task, index) => {
              const priorityInfo = getPriorityInfo(task);
              const dueDateInfo = formatDueDate(task.duedate);
              
              return (
                <React.Fragment key={`${task.boardId}-${task.stackId}-${task.id}`}>
                  <ListItem 
                    sx={{ 
                      px: 0,
                      py: 0.75,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(4, 89, 201, 0.1)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: task.done ? '#48bb78' : '#9BB8D9',
                        width: 28, 
                        height: 28,
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {task.done ? (
                          <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: '#0459C9' }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              textDecoration: task.done ? 'line-through' : 'none',
                              opacity: task.done ? 0.7 : 1
                            }}
                          >
                            {task.title}
                          </Typography>
                          {dueDateInfo && (
                            <Chip
                              label={dueDateInfo.text}
                              size="small"
                              color={dueDateInfo.color}
                              variant="outlined"
                              icon={<ScheduleIcon sx={{ fontSize: '0.65rem !important' }} />}
                              sx={{ 
                                height: 18, 
                                fontSize: '0.65rem',
                                borderColor: dueDateInfo.color === 'error' ? '#f56565' : '#9BB8D9',
                                color: dueDateInfo.color === 'error' ? '#f56565' : '#0459C9'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          <Chip
                            label={task.stackTitle}
                            size="small"
                            variant="outlined"
                            icon={<FolderIcon sx={{ fontSize: '0.65rem !important' }} />}
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                          {task.assignedUsers?.length > 0 && (
                            <Chip
                              label={`${task.assignedUsers.length} Person(en)`}
                              size="small"
                              variant="outlined"
                              icon={<PersonIcon sx={{ fontSize: '0.65rem !important' }} />}
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                          {priorityInfo.level !== 'Normal' && (
                            <Chip
                              label={priorityInfo.level}
                              size="small"
                              color={priorityInfo.color}
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activeTasks.slice(0, 10).length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
        
        {/* Show count if more tasks exist */}
        {activeTasks.length > 10 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              und {activeTasks.length - 10} weitere Aufgaben...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Statistics Footer */}
      <Box sx={{ 
        mt: 2, 
        pt: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Aktiv: {activeTasks.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Erledigt: {completedTasks.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Boards: {tasksData?.boards?.length || 0}
          </Typography>
        </Box>
        {tasksData?.total_cards !== undefined && (
          <Typography variant="caption" color="text.secondary">
            Gesamt: {tasksData.total_cards} Aufgaben
          </Typography>
        )}
      </Box>
    </Box>
  );
}