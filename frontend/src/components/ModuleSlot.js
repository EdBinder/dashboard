import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

/** ModuleSlot wraps an individual module panel inside the 16x9 grid. */
export default function ModuleSlot({ title, children, sx = {} }) {
  return (
    <Paper elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        minWidth: 0,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 5,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 25px -5px rgba(4, 89, 201, 0.1), 0 4px 6px -2px rgba(4, 89, 201, 0.05)',
          transform: 'translateY(-2px)',
          borderColor: '#9BB8D9'
        },
        ...sx,
      }}
    >
      {title && (
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            mb: 1.5,
            color: '#0459C9',
            fontSize: '1.1rem',
            borderBottom: '2px solid #e2e8f0',
            pb: 1
          }} 
          noWrap
        >
          {title}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}
