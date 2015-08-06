var express = require('express');
var app = express();
var routes = require('./app/routes/index.js');
var protocol = require('http');
var logger = require('./app/config/log.js');

routes.addRoutes(app);

protocol.createServer(app).listen(4000, function(){
  logger.info('[server] started on %s', 4000);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
});