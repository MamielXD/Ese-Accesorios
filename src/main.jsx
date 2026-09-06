import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import ToasterProvider from '@/components/ToasterProvider';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App/>
    <ToasterProvider />
  </React.StrictMode>
);