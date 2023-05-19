import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { init } from "@dittolive/ditto"
import App from './App';

(async () => {
  await init()
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );

})()