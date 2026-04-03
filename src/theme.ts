import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#4f7ef8' },
    success: { main: '#2e7d32' },
    secondary: { main: '#7c4dff' },
    background: { default: '#f0f2f5' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  components: {
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          '&:not(:last-child)': { borderBottom: 0 },
          '&::before': { display: 'none' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { backgroundColor: '#fafafa', minHeight: 44 },
        content: { margin: '8px 0' },
      },
    },
  },
})
