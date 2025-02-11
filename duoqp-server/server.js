const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const db = require("./models");
const dbConfig = require('./config/db.config.js');

const app = express();
const expressWs = require('express-ws')(app);//check vulnerabilities
const wss = expressWs.getWss();
app.expressWs = expressWs;
app.wss = wss;
const Role = db.role;

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`)
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


function initial() {
  Role.estimatedDocumentCount().then((count) => {
    if (count === 0) {
      new Role({
        name: "user"
      }).save().then(() => {
        console.log("added 'user' to roles collection");
      }).catch((err) => {
        console.log("error", err);
      });

      new Role({
        name: "moderator"
      }).save().then(() => {
        console.log("added 'moderator' to roles collection");
      }).catch((err) => {
        console.log("error", err);
      });

      new Role({
        name: "admin"
      }).save().then(() => {
        console.log("added 'admin' to roles collection");
      }).catch((err) => {
        console.log("error", err);
      });
    }
  }).catch((err) => {
    console.log("error", err);
  });
}

var corsOptions = {
  credentials: true,
  origin: "http://localhost:4200"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "duodaddy-session",
    keys: ["COOKIE_SECRET"], // should use as secret environment variable
    httpOnly: true
  })
);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to duoqp." });
});
const queues = {};
const chats = {};
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/queue.routes')(app,wss);
require('./routes/websocket.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});