import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

/** ModuleSlot wraps an individual module panel inside the 16x9 grid. */
export default function ModuleSlot({ title, children, sx = {} }) {
  return (
    <Paper elevation={3}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 1.5,
        minWidth: 0,
        ...sx,
      }}
    >
      {title && (
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
          {title}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}
