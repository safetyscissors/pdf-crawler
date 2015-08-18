var phantomService = require('../services/phantomService');
var mysqlService = require('../services/mysqlService');
var logger = require('winston');
var _ = require('underscore');

exports.healthCheck = function(req,res,next){
  var timestamp= (new Date).toISOString();
  res.send(timestamp);
};

exports.errorCheck = function(error, req, res, next){
  var message = 'request ended';
  if(error){
    message += ' - ' + error.message;
  }

  if(!res.headersSent) {
    res.send(message);
  }
};

exports.initPhantom = function(req, res, next){
  phantomService.startServer(req, next);
};


exports.getServerVar = function(key){
  var value = null;
  value = process.env[key];

  if(!value) logger.warn('[server] missing server variable with missing key:'+key);
  return value;
};

exports.loadServerVars = function(req, res, next){
  var configVars = [
    //domino login
    'dominoUserName', 'dominoPassword',

    //domino site map
    'dominoBaseUrl', 'dominoAuthUrl', 'dominoListUrl', 'dominoPageUrl',

    //loggly keys
    'logglySubdomain', 'logglyInputToken',

    //s3 login
    's3bucketName', 's3accessKeyId', 's3secretAccessKey', 's3region', 's3sslEnabled', 's3maxRetries',

    //database login
    'dbHost', 'dbUser', 'dbPassword', 'database'
  ];

  var configObj = {};
  _.each(configVars, function(configName){
    configObj[configName] = exports.getServerVar(configName);
  });

  req.config = configObj;
  next();

};