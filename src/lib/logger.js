import chalk from 'chalk'

import { parse } from 'url'

const bodyLength = 40;
const queryLength = 20;


const levelColors = {
  INFO: chalk.white,
  WARN: chalk.hex('#EEA500'),
  ERROR: chalk.red,
  FATAL: chalk.red
}


const logger = () => {
  return (req, res, next) => {
    requestLogger( req, res )
    next()
  }
}

function infoLogger( msg, logLevel = 'INFO', req = undefined )
{
  const typeCode = 'i'

  const reqId = req ? req.requestId.toString(16) : 0
  logLevel = levelColors[logLevel]( logLevel )

  const separator = ' ';

  const dateString = date();

  const fields = [ typeCode, dateString, logLevel, msg ]

  console.log( fields.join( separator ) );
  
}

function wsLogger( ws, event ) {
  const typeCode = 'w'
  
  const separator = ' ';

  const dateString = date();
  const fields = [ typeCode, dateString, event, ws.remoteAddress ]
  console.log( fields.join( separator ) );
}


function requestLogger( req, res )
{

  // TODO: Track and log the number of db calls
  
  const typeCode = 'r';
  const scheme = req.socket.localPort == process.env.PORT_HTTPS ? "https" : "http";
  
  const parsedUrl = new URL( req.url, `${scheme}://${req.headers.host}` );

  var query = parsedUrl.search;

  // Format: Date IP code method pathname <other fields>
  res.on('finish', function() {
    let code = colorCode( res.statusCode );

    const elapsed = req.perf?.startTime !== undefined ? req.perf.startTime.elapsed() : 0
    const dbCalls = req.log?.dbCalls !== undefined ? req.log.dbCalls : 0

    const separator = ' ';

    const dateString = date();
    const fields = [ typeCode, dateString, req.requestID.toString(16), elapsed, dbCalls, scheme, req.ip, code, req.method, `${parsedUrl.pathname}${query}` ];
    console.log( fields.join( separator ) );
  })
}

function timingLogger( req, timings )
{
  const typeCode = 't'
  const dateString = date();
  const separator = ' ';

  const pairs = []
  Object.entries( timings ).forEach( ([k,v]) => {
    pairs.push( `${k}: ${v}` )
  })

  const fields = [ typeCode, dateString, req.requestID.toString(16), ...pairs  ]

  console.log( fields.join( separator ) );
}



function dbLogger( operation, elapsed, error = undefined, req = undefined )
{
  const typeCode = 'd';
  const separator = " ";
  const dateString = date();

  let reqId
  
  reqId = req ? req.requestID.toString(16) : 0

  if ( req )
  {
    req.log ??= {}
    req.log.dbCalls = req.log.dbCalls === undefined ? 1 : req.log.dbCalls + 1
  }



  const status = error ? chalk.red('error') : chalk.green('ok')
  
  const fields = [ typeCode, dateString, reqId, status, operation, elapsed ];
  if ( error )
  {
    fields.push( error )
  }
  console.log( fields.join( separator ) );
}

function date()
{
  var now = new Date();
  var dateString =
      now.getFullYear() + "/" +
      ("0" + (now.getMonth()+1)).slice(-2) + "/" +
      ("0" + now.getDate()).slice(-2) + " " +
      ("0" + now.getHours()).slice(-2) + ":" +
      ("0" + now.getMinutes()).slice(-2) + ":" +
      ("0" + now.getSeconds()).slice(-2) + '.' +
      ("00" + now.getMilliseconds()).slice(-3);

  return dateString;
}


function colorCode( status )
{
  let code = status;
  switch( Math.floor(code / 100) )
  {
    case 2:
    code = chalk.green(code);
    break;
    case 3:
    code = chalk.blue(code);
    break;
    case 4: 
    code = chalk.yellow(code);
    break;
    case 5: 
    code = chalk.red(code);
    break;
  }

  return code;
}

export { requestLogger, dbLogger, infoLogger, timingLogger, wsLogger  }
export default logger

