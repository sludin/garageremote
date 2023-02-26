import WebSocket, { WebSocketServer } from 'ws'
import fs from 'fs';
import https, { createServer } from 'https'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import { MessageResponse, EventResponse } from './messages.js'

import { wsLogger, infoLogger as info } from './logger.js'

import express from 'express'

class JWTMessageServer
{
  
  constructor()
  {
    this.port = undefined
    this.key = undefined
    this.cert = undefined
    this.subscriber = undefined
  }

  open( { https, secret } ) {

    
    //    this.port = port
    //    this.key = key
    //    this.cert = cert
    this.subscriber = undefined
    this.secret = secret

    this.httpserver = https

    //    this.httpserver.listen( this.port )

    const states = [
      'request',
      'checkContinue',
      'checkExpectation',
      'clientError',
      'close',
      'connect',
      'connection',
      'dropRequest',
      'request',
      'upgrade'
    ]
    
    states.forEach( (state) => this.httpserver.on( state, () => info( `HTTPServer: ${state}` ) ))


    this.wss = new WebSocketServer( { server: this.httpserver } )

    const wssStates = 
    [
     'close',
     'error',
     'headers',
     'listening',
      'wsClientError'
    ]
    wssStates.forEach( (state) => this.wss.on( state, () => info( `WSSServer: ${state}` ) ) )
    
    this.wss.on( 'connection', (ws, req) => {

      ws.remoteAddress = req.socket.remoteAddress
      wsLogger( ws, 'connect' )

      ws.on( 'close', ( code, buffer ) => {
        wsLogger( ws, `close: ${code} ${buffer}` )
      })

      ws.on( 'error', console.error )

      ws.on( 'message', (data, isBinary) => {
        try {
          const decoded = this.decodeToken( data )
          this.handleMessage( ws, decoded )
        }
        catch( error )
        {
          wsLogger( ws, 'message: Error' )
          console.log( error )
          ws.close()
        }
      })

      ws.on( 'ping', (buffer) => {
        wsLogger( ws, 'ping')
        ws.pong( buffer, (error) =>{
          if ( error ) {
            console.log( error )
          }
        })
      })

      ws.on( 'pong', ( data ) => {
        wsLogger( ws, 'pong' )
      })
      ws.on( 'redirect', ( url, req ) => {
        wsLogger( ws, 'redirect' )
      })

      ws.on( 'unexpected-response', ( req, res ) => {
        wsLogger( ws, 'unexpected-response' )
      })
      
      ws.on( 'upgrade', ( res ) => {
        wsLogger( ws, 'upgrade' )
      })


    })

  }


  
  decodeToken( token ) {
    const decoded = jwt.verify( token.toString(), this.secret )
    delete decoded.nonce
    delete decoded.iat
    return decoded
  }

  makeToken( data )
  {
    const nonce = crypto.randomBytes(16).toString('hex');
    data.nonce = nonce
    return jwt.sign( data, this.secret )
  }

  handleMessage( ws, msg )
  {
    const action = msg.action

    if ( ! action )
    {
      wsLogger( ws, "invalid" ) 
      throw "Invalid message"
    }

    wsLogger( ws, msg.action ) 

    if ( action === "subscribe" )
    {
      const message = new MessageResponse( { msg: "subscribed" } )
      const object = JSON.parse( message.toJson() )
      const token = this.makeToken( object )
      ws.send( token  )

      this.subscriber = ws
    }
    else
    {
      throw "Unimplemented message"
    }
  }

  send( response )
  {
    if ( this.subscriber !== undefined )
    {
      const object = JSON.parse( response.toJson() )
      const token = this.makeToken( object )
      this.subscriber.send( token  )
    }
  }
  
}


export default new JWTMessageServer()










