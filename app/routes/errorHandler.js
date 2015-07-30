
var errorHandler = function(error, req, res){
  console.log('error:',error);
  res.send('hi')
};


module.exports = errorHandler;