var logger = require('winston');

var errorHandler = function(error, req, res){
  logger.error('[server]' + error.msg, error);
  res.send('hi')
};


module.exports = errorHandler;