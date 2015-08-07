var logger = require('winston');
var Loggly = require('winston-loggly').Loggly;
var logglyOptions = require('./logglyKeys.json');

logger.add(Loggly, logglyOptions);
logger.add(logger.transports.File, {filename:'../logs/prod.log'});
//todo add console timestamp
logger.info('[server] winston init with console, loggly, and by file');
module.exports = logger;