var Spooky = require('spooky');
var async = require('async');

exports.test = function(req, res, next) {
  var spookyConfig = {
    child:{transport:'http'},
    casper:{logLevel:'debug', verbose:true}
  };

  var spooky = new Spooky(spookyConfig, function(err){
    spooky.start('http://google.com');
    spooky.then(function(){
      casper.capture('app/pdfs/gg.jpg');
    });
    spooky.run();
  });

  next();
};