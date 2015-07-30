var phantomService = require('../services/phantomService');
var mysqlService = require('../services/mysqlService');
exports.healthCheck = function(req,res,next){
  var timestamp= (new Date).toISOString();
  res.send(timestamp);
};

exports.errorCheck = function(error, req, res, next){
  var message = 'request ended';
  if(error){
    message += ' - ' + error.message;
  }
  res.send(message);
};

exports.initPhantom = function(req, res, next){
  phantomService.startServer(req, next);
};