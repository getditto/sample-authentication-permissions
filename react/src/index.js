import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from "@auth0/auth0-react";
import { init } from "@dittolive/ditto"

(async () => {

  await init()

  ReactDOM.render(
    <React.StrictMode>

      <Auth0Provider
        domain="dev-c5334s65djcbtc5w.us.auth0.com"
        clientId="ouJ8stf7zBtx3fOEN6Bg6viSUCNArxTN"
        redirectUri={window.location.origin}
        audience="https://dev-c5334s65djcbtc5w.us.auth0.com/api/v2/"
        scope="read:current_user update:current_user_metadata"
      >
        <App />
      </Auth0Provider>
    </React.StrictMode>,
    document.getElementById('root')
  );
})()
