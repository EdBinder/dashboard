import React from 'react';
import { Box } from '@mui/material';
import ModuleSlot from './ModuleSlot';

/**
 * 16x9 grid layout component.
 * Props:
 * - layout: Array of module definitions:
 *    [{ id: 'module1', x:0, y:0, w:4, h:2, title:'Title', component: <MyComp/> }]
 *    Coordinates:
 *      x: 0..15 (column start)
 *      y: 0..8  (row start)
 *      w: 1..16 (width in columns) must fit within 16
 *      h: 1..9  (height in rows) must fit within 9
 *  Invalid modules (overflow) are ignored with a console.warn.
 */
export default function GridLayout({ layout = [], gap = 8 }) {
  const valid = layout.filter(m => {
    const inside = m.x >= 0 && m.y >= 0 && m.w > 0 && m.h > 0 && (m.x + m.w) <= 16 && (m.y + m.h) <= 9;
    if (!inside) {
      // eslint-disable-next-line no-console
      console.warn('[GridLayout] Skipping module outside bounds:', m.id || m.title, m);
    }
    return inside;
  });

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        width: '100%',
        aspectRatio: '16 / 9',
        gridTemplateColumns: 'repeat(16, 1fr)',
        gridTemplateRows: 'repeat(9, 1fr)',
        gap: gap,
      }}
    >
      {valid.map(m => (
        <ModuleSlot key={m.id}
          title={m.title}
          sx={{
            gridColumn: `${m.x + 1} / span ${m.w}`,
            gridRow: `${m.y + 1} / span ${m.h}`,
          }}
        >
          {m.component || null}
        </ModuleSlot>
      ))}
    </Box>
  );
}
