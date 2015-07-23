

exports.healthCheck = function(req,res,next){
  var timestamp= (new Date).toISOString();
  res.send(timestamp);
};

exports.errorCheck = function(error, req, res){
  console.log(error);
  if(error){
    res.send(error.msg);
  }
  res.send('request end')
};