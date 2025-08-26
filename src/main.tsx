import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App.tsx';
import { Web3Provider } from './contexts/Web3Context';
import { PriceProvider } from './contexts/PriceContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Suppress SES lockdown warnings
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    // Skip SES deprecation warnings
    if (message.includes('dateTaming') || 
        message.includes('mathTaming') || 
        message.includes('Removing unpermitted intrinsics') ||
        message.includes('toTemporalInstant')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <PriceProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </PriceProvider>
    </Web3Provider>
  </StrictMode>,
)
