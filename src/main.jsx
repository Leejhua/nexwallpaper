// 核心入口文件
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import ReactGA from 'react-ga4';

const TRACKING_ID = 'G-95G8M7F108'; // 替换为您的 Google Analytics Tracking ID
ReactGA.initialize(TRACKING_ID);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
