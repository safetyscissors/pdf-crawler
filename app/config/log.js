var logger = require('winston');
var Loggly = require('winston-loggly').Loggly;
var server = require('../routes/serverRoutes');

var logglyOptions = {
  subdomain: server.getServerVar('logglySubdomain'),
  inputToken: server.getServerVar('logglyInputToken')
};

logger.add(Loggly, logglyOptions);
logger.add(logger.transports.File, {filename:'../logs/prod.log'});
//todo add console timestamp
logger.info('[server] winston init with console, loggly, and by file');
module.exports = logger;