class Message {
  toJson = () => {
    return JSON.stringify( { message: this } )
  }
}

class Request extends Message {
  
}

class Response extends Message {

  constructor( { status = "ok" } )
  {
    super()
    this.response = {}
    this.response.status = status
    this.type = "response"
  }
  
}

class EventResponse extends Response {

  constructor( { event, status = "ok" } )
  {
    super( status )
    this.response.event = event
    this.response.type = "event"
  }
  
}

class MessageResponse extends Response {

  constructor( { msg, status = "ok" } )
  {
    super( status )
    this.response.msg = msg
    this.response.type = "msg"
  }
  
}


export { MessageResponse, EventResponse }
