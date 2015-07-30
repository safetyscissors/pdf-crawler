var phantom = require('phantom');
var dominoUrls = require('../config/dominoUrls');
var mysqlService = require('../services/mysqlService');
var _ = require('underscore');


exports.authenticate = function(){
  var loginData = require('../config/dominoLogin');
  var request = {
    url:dominoUrls.auth,
    method:'post',
    data:loginData
  };

  return request;
};

exports.testMysql = function(db, callback){
  for(var i=0;i<100;i++) {
    setTimeout(function() {
      mysqlService.getNextRecordsToScrape(db, dominoUrls.list, function (dbErr, dbResult, increment) {
        var debug = {
          err: dbErr,
          res: dbResult,
          inc: increment
        };
        console.log(debug);
      })
    }, 100*Math.random()*i);
  }
};

exports.loadListing = function(db, callback){
  mysqlService.getNextRecordsToScrape(db, dominoUrls.list, function(dbErr, dbResult, increment){
    if(dbErr) return callback(dbErr);

    var getparams = '';
    if(_.has(dbResult[0], 'current_list_index')){
      getparams = '?OpenView&Count=' + increment + '&Start=' + dbResult[0]['current_list_index'];
    }

    var request = {
      url:dominoUrls.list + getparams,
      method:'get'
    };

    callback(dbErr, request);
  });
};

exports.loadForm = function(callback){

};

exports.loadPage = function(pageData){
  if(!_.has(pageData, 'url')) return false;

  var request = {
    url:pageData.url,
    method:'get'
  };

  return request;
};