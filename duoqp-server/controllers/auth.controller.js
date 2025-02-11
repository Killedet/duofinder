const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),

  });
  user.save().then(() => {

    if(req.body.roles){
      Role.find({name:{$in:req.body.roles}}).exec().then((roles) => {
        user.roles = roles.map((role) => role._id);
        user.save().then(() =>{
          res.send({ message: "User was registered successfully!" });
        }).catch((err) => {
          res.status(500).send({ message: err });
          return;
        });
      }).catch((err) => {
        res.status(500).send({ message: err });
        return;
      });
    }else{
      Role.findOne({name:'user'}).exec().then((role) => {
        console.log(role);
        console.log(role._id);
        user.roles = [role._id];
        user.save().then(() =>{
          res.send({ message: "User was registered successfully!" });
        }).catch((err) => {
          res.status(500).send({ message: err });
          return;
        });
      }).catch((err) => {
        res.status(500).send({ message: err });
        return;
      });
    }

  }).catch((err) => {
    res.status(500).send({ message: err });
      return;
  });
  
};

exports.signin = (req, res) => {
  User.findOne({username: req.body.username})
  .populate("roles", "-__v")
  .exec().then((user) => {
    if (!user){
      return res.status(404).send({ message: "User Not found." });
    }
    var passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password);
    if (!passwordIsValid){
      return res.status(401).send({ message: "Invalid Password!" });
    }
    const token = jwt.sign({ id: user.id },
                              config.secret,
                              {
                                algorithm: 'HS256',
                                allowInsecureKeySizes: true,
                                expiresIn: 86400, // 24 hours
                              });

    var authorities = [];

    for (let i = 0; i < user.roles.length; i++) {
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
    }

    req.session.token = token;

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
    });
  }).catch((err) => {
    res.status(500).send({ message: err });
    return;
  })
  
};

exports.signout = async (req, res) => {
  try {
    //console.log("not error in signout");
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    console.log("error in signout");
    this.next(err);
  }
};