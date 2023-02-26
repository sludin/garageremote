export default (app) => {
  app.locals.requestId = 0;
  return ( req, res, next ) => {
    req.app.locals.requestId++;
    req.requestID = req.app.locals.requestId;
    next();
  }
}
