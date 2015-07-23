
var errorHandler = function(error, req, res){
  console.log('hi',error);
  res.send('hi')
};


module.exports = errorHandler;