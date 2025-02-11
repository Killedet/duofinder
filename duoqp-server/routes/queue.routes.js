const { authJwt } = require("../middlewares");
const controller = require("../controllers/queue.controller");

module.exports = function(app,wss) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });
  
  app.post("/api/queue/enter", [authJwt.verifyToken], controller.enterQueue);
};