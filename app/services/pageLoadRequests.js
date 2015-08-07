var dominoUrls = require('../config/dominoUrls');
var mysqlService = require('../services/mysqlService');
var _ = require('underscore');

/**
 * Returns the request to login to domino site. Requires '../config/dominoLogin'
 * @returns {{url: *, method: string, data}}
 */
exports.authenticate = function(){
  var loginData = require('../config/dominoLogin');
  var request = {
    url:dominoUrls.auth,
    method:'post',
    data:loginData
  };

  return request;
};

/**
 * [UNUSED] test to stress mysql and work out race condition
 * Calls mysql service 100x to get the next 10 with a small random amount of time between each request.
 * @param db
 * @param callback
 */
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

/**
 * Returns the request to domino for the actual records.
 * Calls mysql service to get the next set of page ids.
 * Configs are based on mysqlService settings on getNextRecordToScrape
 * @param db
 * @param callback
 */
exports.loadListing = function(db, callback){
  mysqlService.getNextRecordsToScrape(db, dominoUrls.list, function(dbErr, dbResult, increment){
    if(dbErr) return callback(dbErr);

    var getparams = '';
    if(dbResult){
      getparams = '?OpenView&Count=' + increment + '&Start=' + dbResult;
    }

    var request = {
      url:dominoUrls.list + getparams,
      method:'get'
    };

    callback(dbErr, request, dbResult);
  });
};

/**
 * Returns the simple get request for a url.
 * @param pageData
 * @returns {*}
 */
exports.loadPage = function(pageData){
  if(!_.has(pageData, 'url')) return false;

  var request = {
    url:pageData.url,
    method:'get'
  };

  return request;
};