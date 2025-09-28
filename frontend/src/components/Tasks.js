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
const REFRESH_INTERVAL = 300000; // 5 minutes

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
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Lade Aufgaben...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon />
            Aufgaben
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const tasks = getAllTasks();
  const activeTasks = tasks.filter(task => !task.done && !task.archived);
  const completedTasks = tasks.filter(task => task.done);

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskIcon />
          <Typography variant="h6">
            Aufgaben
          </Typography>
          <Chip 
            label={`${activeTasks.length} aktiv`} 
            size="small" 
            color="primary"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              {lastUpdated.toLocaleTimeString('de-DE')}
            </Typography>
          )}
          <IconButton onClick={handleRefresh} disabled={loading} size="small">
            <RefreshIcon />
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
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderRadius: 1
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: task.done ? 'success.main' : 'grey.300',
                        width: 32, 
                        height: 32 
                      }}>
                        {task.done ? (
                          <CheckCircleIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
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
                              icon={<ScheduleIcon sx={{ fontSize: '0.75rem !important' }} />}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={task.stackTitle}
                            size="small"
                            variant="outlined"
                            icon={<FolderIcon sx={{ fontSize: '0.75rem !important' }} />}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          {task.assignedUsers?.length > 0 && (
                            <Chip
                              label={`${task.assignedUsers.length} Person(en)`}
                              size="small"
                              variant="outlined"
                              icon={<PersonIcon sx={{ fontSize: '0.75rem !important' }} />}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {priorityInfo.level !== 'Normal' && (
                            <Chip
                              label={priorityInfo.level}
                              size="small"
                              color={priorityInfo.color}
                              sx={{ height: 18, fontSize: '0.65rem' }}
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