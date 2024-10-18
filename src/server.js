import * as dotenv from 'dotenv' 
dotenv.config()

import express from 'express'
import fs from 'fs';
import { createServer } from 'https'
import messageServer from './lib/wsocket.js'
import { createSmartApp } from './smartapp.js'

import requestid from './middleware/requestid.js'
import logger, { infoLogger } from './lib/logger.js'


const bindAddr  = process.env.BINDADDR || '127.0.0.1'
const portHttps = process.env.PORT     || 8443
const tlsDir    = process.env.TLS_DIR  || '/var/smartthings/tls/letsencrypt/live/smartthings.scrapbot.org'
const key       = process.env.TLS_KEY  || 'privkey.pem'
const fullchain = process.env.TLS_CERT || 'fullchain.pem'


// Create HTTPS Server
const tlsOptions = loadTLS( tlsDir, key, fullchain )
const https = createServer( tlsOptions ).listen( portHttps, err => {
  if (err) throw err
  infoLogger( `Listening for HTTPS on localhost:${portHttps}` )
}) 

// Open the WS message server with the HTTPS server
messageServer.open( { https, secret: process.env.JWT_SECRET } )

// Create the smart app
const smartapp = createSmartApp( messageServer )

// Set up the express app
const app = express();

app.use( express.json() );
app.use( requestid(app) )
app.use( logger() )

// Delegate POST requests to the smart app
app.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
});

app.get( '/', ( req, res, next ) => {
  res.send( "OK\n" )
})

// Delegate non-upgrade HTTP requests to the express app
https.on( 'request', app )


function loadTLS(tlsDir, keyName, fullChain)
{
  let key;
  let chain;

  try
  {
    key = fs.readFileSync(`${tlsDir}/${keyName}`);
  }
  catch (err)
  {
    console.log(`Could not load key: ${keyName}: ${err}`);
    process.exit(1);
  }

  try
  {
    chain = fs.readFileSync(`${tlsDir}/${fullChain}`);
  }
  catch (err)
  {
    console.log(`Could not load chain: ${fullChain}: ${err}`);
    process.exit(1);
  }

  const options = {
    key:  key,
    cert: chain
  };

  return options;
}



