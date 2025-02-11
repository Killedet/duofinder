const { authJwt } = require("../middlewares");
const controller = require("../controllers/websocket.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });
  app.get("/api/websocket/connect", [authJwt.verifyToken], function(req, res, next){
    console.log('get route');
    res.end();
  });
  
  app.ws("/api/websocket/:type(na|euw)/:type(iron|bronze)", controller.connect);
  app.ws("/api/websocket/connect", controller.connect);
};