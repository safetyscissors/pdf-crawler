var phantom = require('phantom');
var queryString = require('query-string');

/**
 * use for pages that redirect or lazy load.
 * returns body html
 * @param requestObj {url:http, method:get/post data:{}} only url and method required
 * @param callback (error, htmlDom, phantomHandler)
 */
exports.phantomLoad = function(requestObj, callback){
  //rcuh requires tls and complains a lot.
  var options = {parameters: {'ignore-ssl-errors': true, 'ssl-protocol':'any'}};

  //start phantom server
  phantom.create(function(phantomHandler){

    //create page accessor
    phantomHandler.createPage(function(page){

      //once page is opened, check for failed, then continue
      var processPage = function(status){
        var error = (status !=='success')? (new Error('[pageLoad] failed phantom page load. status:' + status)) : null;
        callback(error);
      };

      //if get, give less arguments
      if(requestObj.method.toLowerCase()=='get'){
        page.open(requestObj.url, requestObj.method, processPage)
      }else{
        page.open(requestObj.url, requestObj.method, queryString.stringify(requestObj.data), processPage)
      }


    })
  }, options);
};


exports.authenticate = function(){
  var loginData = require('../config/dominoLogin');
  var dominoUrls = require('../config/dominoUrls');
  var request = {
    url:dominoUrls.auth,
    method:'post',
    data:loginData
  };

  return request;
};

exports.loadListing = function(){

};

exports.loadForm = function(callback){

};