var pageRequestService = require('../services/pageLoadRequests');
var phantomService = require('../services/phantomService');
var parsingService = require('../services/pageParsing');
var mysqlService = require('../services/mysqlService');
var async = require('async');
var _ = require('underscore');

exports.unauth = function(req, res, next){};

exports.listing = function(req, res, next){
  console.log('hi');
  //setup list page
  pageRequestService.loadListing(req.db, function(dbError, listRequest){

    //send request
    phantomService.loadPage(req.phantomServer, listRequest, function(loadError, loadPage){
      if (loadError) return next(loadError);

      //return all html
      loadPage.evaluate(
        function(){ return document.body.innerHTML },
        function(body){ parsingService.extractDiv('content', body, function(domError, pages){
          if (domError) return next(domError);

          console.log(pages);
          req.listing = pages;
          return next();
        })}
      );
    });
  });
};

exports.pdfPages = function(req, res, next){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    var pageRequest = pageRequestService.loadPage(pageData);
    if(!pageRequest) return next(new Error('failed to create pageData: ' + JSON.stringify(pageData)));

    phantomService.loadPage(req.phantomServer, pageRequest,
      phantomService.pdfPage.bind(null, pageData, function(pdfError, savedData){
        if (pdfError) return eachCallback(pdfError);

        mysqlService.saveListRecord(req.db, savedData, function (saveError) {
          eachCallback(saveError);
        });
      })
    );
  }, function(callbackError){
    if(callbackError) return next(callbackError);
    res.send('done')
  });
};

exports.auth = function(req, res, next){

  //setup auth request
  var authRequest = pageRequestService.authenticate();

  //send request
  phantomService.loadPage(req.phantomServer, authRequest, function(loadError, loadPage){
    next(loadError);
  });

};