import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import { store } from './store';
import { AuthListener } from './store/AuthListener';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

const theme = createTheme({
  palette: {
    primary: { main: '#ff5a1f' },
    secondary: { main: '#12151a' },
  },
  typography: {
    fontFamily: '"Outfit", "Segoe UI", sans-serif',
  },
  shape: { borderRadius: 10 },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthListener>
            <App />
          </AuthListener>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
