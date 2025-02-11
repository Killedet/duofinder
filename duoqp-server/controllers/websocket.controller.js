const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

const chats = {};
const queues = {};

exports.connect = (ws, req) => {
  const token = req.session.token;
  if (!token) {
    ws.close(1008, 'Unauthorized');
  }

  jwt.verify(token,
            config.secret,
            (err, decoded) => {
              if (err) {
                ws.close(1008, 'Unauthorized');
              }
              ws.userId = decoded.id;
              console.log("user connected");
            });

  ws.userRoles = req.session.userRoles;
  ws.partnerRoles = req.session.partnerRoles;
  ws.rank = req.session.rank;
  ws.region = req.session.region;
  ws.matchState = "waiting";

  let userMatch = false;
  let partnerMatch = false;
  let matchFound = false;
  let partner = null;
  let checkForMatch = true;

  if(!queues[req.session.region]){
    queues[req.session.region] = {};
  }
  if(!queues[req.session.region][req.session.rank]){
    queues[req.session.region][req.session.rank] = [];
    checkForMatch = false;
  }
    
  if(checkForMatch && (queues[req.session.region][req.session.rank].length > 0)){
    for(let i = 0; i < queues[req.session.region][req.session.rank].length; i++){
      let client = queues[req.session.region][req.session.rank][i];
      if((ws.userRoles ^ client.partnerRoles) < (ws.userRoles + client.partnerRoles)){
        console.log("first match");
        userMatch = true;
      }
      if((ws.partnerRoles ^ client.userRoles) < (ws.partnerRoles + client.userRoles)){
        console.log("second match");
        partnerMatch = true;
      }
      if(userMatch && partnerMatch){
        console.log("MATCH");
        partner = client;
        matchFound = true;
        queues[req.session.region][req.session.rank].splice(i,1);
        break;
      }else{
        console.log("no match");
        userMatch = false;
        partnerMatch = false;
      }
    }
    queues[req.session.region][req.session.rank].push(ws);
  }else{
    queues[req.session.region][req.session.rank].push(ws);
  }

  if(matchFound){
    let matchId = ws.userId + partner.userId;
    partner.matchId = matchId;
    ws.matchId = matchId;
    chats[matchId] = [];
    
    console.log(partner.readyState);
    if (partner.readyState) {
      partner.send(JSON.stringify({messageType:"matchfound",matId:matchId}));
    }
    ws.send(JSON.stringify({messageType:"matchfound",matId:matchId}));
    chats[matchId].push(ws);
    chats[matchId].push(partner);
  }
  
  ws.send(JSON.stringify({messageType:"connected"}));

  ws.on('close', function() {
    //need to remove from queues and chats
    
      if(ws.matchId in chats){
        for(const client of chats[ws.matchId]){
          console.log("clients in chat");
          if(client.userId !== ws.userId){
            console.log("clients in chat not guy that exited");
            if(client.matchState !== "finished"){
              console.log("waiting partner sent back to queue")
              queues[ws.region][ws.rank].push(client);
              client.send(JSON.stringify({messageType:"partnerdeclined"}));
            }else{
              console.log("match deleted users disconnected");
              client.send(JSON.stringify({messageType:"disconnected"}));
              client.close();
            }
            
          }
        }
        delete chats[ws.matchId];

        for(let i = 0; i < queues[ws.region][ws.rank].length; i++){
          if(ws.userId === queues[ws.region][ws.rank][i].userId){
            console.log("user removed")
            queues[ws.region][ws.rank].splice(i,1);
            break;
          }
        }
      }else{
        for(let i = 0; i < queues[ws.region][ws.rank].length; i++){
          if(ws.userId === queues[ws.region][ws.rank][i].userId){
            console.log("user closed window while in queue and removed")
            queues[ws.region][ws.rank].splice(i,1);
            break;
          }
        }
      }
    
    console.log('The connection was closed!');
  })

  ws.on('message', function(msg) {
    const json = JSON.parse(msg);
    
    if(json.messageType === "CANCELQUEUE"){
      ws.send(JSON.stringify({messageType:"cancel"}));
      ws.close();
      
    }else if(json.messageType === "CANCELMATCH"){
      ws.send(JSON.stringify({messageType:"cancel"}));
      ws.close();
      
    }else if(json.messageType === "PRIVATECHAT"){
      for(const client of chats[ws.matchId]){
        client.send(JSON.stringify({messageType:"chat",messageData:json.messageData,messageAuthor:json.messageAuthor}));
      }
    }else if(json.messageType === "ACCEPTMATCH"){
      if(ws.matchId in chats){
        ws.matchState = "accepted";
        let matched = true;
        for(const client of chats[ws.matchId]){
          if(client.matchState !== "accepted"){
            matched = false;
            break;
          }
        }
        if(matched){
          for(const client of chats[ws.matchId]){
            client.matchState = "finished";
            client.send(JSON.stringify({messageType:"successfulmatch"}));
          }
        }
        
      }else{
        queues[ws.region][ws.rank].push(ws);
        client.send(JSON.stringify({messageType:"partnerdeclined"}));
      }
    }else{
      ws.send(JSON.stringify({messageType:"default"}));
    }
    
  });
  
};