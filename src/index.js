import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    primary: {
      main: '#c45c5c',
      dark: '#a84d4d',
      light: '#e8a0a0',
    },
    secondary: {
      main: '#8b6914',
      light: '#c9a227',
    },
    background: {
      default: '#fdf8f6',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
    h4: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
    h5: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
    h6: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);