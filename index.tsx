import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Aetheria: Script execution started.");

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Aetheria: Root element not found.");
    return;
  }

  try {
    console.log("Aetheria: Mounting React application...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Aetheria: React mount successful.");
  } catch (err) {
    console.error("Aetheria: Failed to mount React app:", err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}