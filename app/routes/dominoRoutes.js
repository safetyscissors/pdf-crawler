var pageRequestService = require('../services/pageLoadRequests');
var phantomService = require('../services/phantomService');
var parsingService = require('../services/pageParsing');
var mysqlService = require('../services/mysqlService');
var s3Service = require('../services/s3Service');
var async = require('async');
var _ = require('underscore');

exports.unauth = function(req, res, next){};

exports.raceTest = function(req, res, next){
  pageRequestService.testMysql(req.db, function(){});
};

exports.listing = function(req, res, next){
  //setup list page
  pageRequestService.loadListing(req.db, function(dbError, listRequest){

    //send request
    phantomService.loadPage(req.phantomServer, listRequest, function(loadError, loadPage){
      if (loadError) return next(loadError);

      //return all html
      loadPage.evaluate(
        function(){ return document.body.innerHTML },
        function(body){ parsingService.readListing('content', body, function(domError, pages){
          if (domError) return next(domError);

          req.listing = pages;
          return next();
        })}
      );
    });
  });
};
/*
exports.pdfPage = function(pageData, callback){
  async.waterfall(
    [
      pageRequestService.loadPage,

      phantomService.loadPage,

      loadPage.evaluate,

      parsingService.readPageForAttachments,

      phantomService.pdfPage,

      mysqlService.saveListRecord
    ],

    //on waterfall end
    function(waterfallError){
      eachCallback(waterfallError);
    }
  )
};
*/

exports.pdfPages = function(req, res, next){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    var pageRequest = pageRequestService.loadPage(pageData);
    if(!pageRequest) return next(new Error('failed to create pageData: ' + JSON.stringify(pageData)));

    phantomService.loadPage(req.phantomServer, pageRequest, function(loadError, loadPage){
      if(loadError) return eachCallback(loadError);

      //return all html
      loadPage.evaluate(
        function(){return document.body.innerHTML},
        function(body){parsingService.readPageForAttachments(body, pageData, function(parseError, attachments){
          if(parseError) return eachCallback(parseError);

          phantomService.pdfPage(loadError, loadPage, pageData, function(pdfError, savedData){
            if (pdfError) return eachCallback(pdfError);

            mysqlService.saveListRecord(req.db, savedData, function (saveError) {
              eachCallback(saveError);
            });
          })
        })}
      );

    });
    /*
    phantomService.loadPage(req.phantomServer, pageRequest,
      phantomService.pdfPage.bind(null, pageData, function(pdfError, savedData){
        if (pdfError) return eachCallback(pdfError);

        mysqlService.saveListRecord(req.db, savedData, function (saveError) {
          eachCallback(saveError);
        });
      })
    );
    */
  }, function(callbackError){
    if(callbackError) return next(callbackError);
    return next();
  });
};

exports.uploadPages = function(req, res, next){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    s3Service.uploadPdf(req.s3, pageData, eachCallback);
  }, function(callbackError){
    if(callbackError) return next(callbackError);
    next()
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

exports.cleanUp = function(req, res, next){
  var tempDir ='app/pdfs';
  var exec = require('child_process').exec, child;
  child = exec('rm app/pdfs/*', function(err, out){
    console.log(out);
    if(err) return next(err);
    res.send('done');

    req.phantomServer.exit();
    console.log('stopping phantom');

    req.db.end(function(err){
      console.log('stopping mysql');
    })
  });
};