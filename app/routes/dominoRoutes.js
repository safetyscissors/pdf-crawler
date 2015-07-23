var request = require('request');
var loadService = require('../services/pageLoad');

exports.auth = function(req, res, next){
  var loginUrl = 'https://bugfixdev.r7.rcuh.com/names.nsf?Login';
  var data = "username=accounting&password=devrepair1";
  request.post({url:loginUrl, form:{username:'accounting', password:'devrepair1'}}, function(logErr, logRes, logBody){
    console.log('logerr:',logErr);
    console.log('status:',logRes.statusCode);
    console.log('logbod:',logBody);

    request('https://bugfixdev.r7.rcuh.com',function(listErr,listRes,listBody){
      console.log(listBody);
    });

  });

};

exports.unauth = function(req, res, next){};

exports.listing = function(req, res, next){};

exports.login = function(req, res, next){
  var loginRequest = {
    url:'https://bugfixdev.r7.rcuh.com/names.nsf?Login',
    method:'post',
    
  };

  loadService.phantomLoad(loginRequest, function(a,b){
    var listingurl = 'https://bugfixdev.r7.rcuh.com/000168d/rcuh6.nsf/Payment+Docs/Final+Central';
    var getparams = '?OpenView&Count=1000';

    request(listingurl, function(listErr, listRes, listBody){
      console.log(listBody);
      res.send('done')
    });


  });
};
