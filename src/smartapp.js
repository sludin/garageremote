import SmartApp from '@smartthings/smartapp'
import { MessageResponse, EventResponse } from './lib/messages.js'
import logger, { infoLogger } from './lib/logger.js'

function createSmartApp( messageServer )
{
  const smartapp = new SmartApp()
  .enableEventLogging(2, false) // logs all lifecycle event requests and responses as pretty-printed JSON. Omit in production
  .page('mainPage', (context, page, configData) => {
        page.section('Sensors', section => {
          section
            .deviceSetting('contactSensor')
            .name( "Garage Door Sensor")
            .capabilities(['contactSensor'])
        });
        page.section('Light', section => {
            section
                .deviceSetting('lights')
                .capabilities(['switch'])
                .permissions('rx')
                .name( "Lights to control")
                .multiple(true);
        });
        page.section('Relay', section => {
            section
                .deviceSetting('relay')
                .capabilities(['switch'])
                .permissions('rx')
                .name( "Relay to control garage door")
                .multiple(true);
        });
      page.section('Door Delay', section => {
        section
          .decimalSetting( 'doordelay' )
            .name( "Delay before closing door automatically")
            .defaultValue( 15 )
          .postMessage( 'Minutes' )
        });
        page.section('lightdelay', section => {
          section
            .decimalSetting( 'lightdelay' )
            .name( "Delay before turning off light")
            .defaultValue( 15 )
            .postMessage( 'Minutes' )
        });
    })
    .updated(async (context, updateData) => {
      await context.api.subscriptions.delete() // clear any existing configuration
      await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'contactSensorEventHandler');
      await context.api.subscriptions.subscribeToDevices(context.config.lights, 'switch', 'switch', 'switchEventHandler');
      await context.api.subscriptions.subscribeToDevices(context.config.relay, 'switch', 'switch', 'relayEventHandler');
//      await context.api.subscriptions.subscribeToHubHealth('hubHealthHandler')

//      console.log( updateData )
//      const myDevices = await context.api.devices.listAll()
//      console.log( myDevices )

      infoLogger( "Update Event")

    })
    .subscribedEventHandler('contactSensorEventHandler', async (context, event) => {
      const value = event.value === 'open' ? 'on' : 'off';
      
      const message = new EventResponse( { event } )
      messageServer.send( message  )

      infoLogger( `Contact sensor event: ${value}` )
      
      await context.api.devices.sendCommands(context.config.lights, 'switch', value);
    })
    .subscribedEventHandler('switchEventHandler', async (context, event) => {
      event.msg = "event"

      const message = new EventResponse( { event } )
      messageServer.send( message )

      infoLogger( `Switch sensor event: ${event.value}` )
    })
    .subscribedEventHandler('relayEventHandler', async (context, event) => {
      infoLogger( `Relay event: ${event.value}` )
    })
  /*
     // Health handler
     .subscribedEventHandler('hubHealthHandler', (context, event) => {
     console.log('HUB HEALTH EVENT RECEIVED')
     console.log( context )
     console.log( event )
     })
   */

  return smartapp
}



export { createSmartApp }

