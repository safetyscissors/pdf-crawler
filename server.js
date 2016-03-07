var express = require('express');
var app = express();
var routes = require('./app/routes/index.js');
var protocol = require('http');
var path = require('path');
var server = protocol.createServer(app);

var logger = require('./app/config/log.js');
var io = require('socket.io')(server);

//serve dashboard
app.get('/', function(req, res){ res.sendFile(path.resolve('app/public/index.html')) });


io.on('connection', function(socket){
  console.log('a user connected');
  io.emit('alert','hello');
});

routes.addRoutes(app, io);

server.listen(4000, function(){
  logger.info('[server] started on %s', 4000);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
});