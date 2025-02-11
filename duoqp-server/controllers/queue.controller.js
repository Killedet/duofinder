exports.enterQueue = (req, res) => {
  req.session.userRoles = req.body.userRoles;
  req.session.partnerRoles = req.body.partnerRoles;
  req.session.rank = req.body.rank;
  req.session.region = req.body.region;
  //res.status(200).send({queueUrl:"ws://localhost:8080/api/websocket/" + req.body.region + "/" + req.body.rank});
  res.status(200).send({queueUrl:"ws://localhost:8080/api/websocket/connect"});
};