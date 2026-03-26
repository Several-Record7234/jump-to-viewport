import ReactDOM from 'react-dom/client';
import React from 'react';
import './index.css';
import { Views } from './components/Views.tsx';

const appElement = document.querySelector('#app');
if (!appElement) throw new Error('Root element #app not found in DOM');
const root = ReactDOM.createRoot(appElement);
root.render(React.createElement(Views));
