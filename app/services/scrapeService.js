var pageRequestService = require('../services/pageLoadRequests');
var phantomService = require('../services/phantomService');
var parsingService = require('../services/pageParsing');
var mysqlService = require('../services/mysqlService');
var s3Service = require('../services/s3Service');
var async = require('async');
var _ = require('underscore');
var logger = require('winston');

exports.scrapeListing = function(req, callback){
  //setup list page
  pageRequestService.loadListing(req.db, function(dbError, listRequest){

    //send request
    phantomService.loadPage(req.phantomServer, listRequest, function(loadError, loadPage){
      if (loadError) return callback(loadError);

      //return all html
      loadPage.evaluate(
        function(){ return document.body.innerHTML },
        function(body){ parsingService.readListing('content', body, function(domError, pages){
          if (domError) return callback(domError);

          req.listing = pages;
          return callback();
        })}
      );
    });
  });
};

exports.scrapeListingPages = function(req, callback){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    async.waterfall([

      //load new page
      function(waterfallCallback){
        var pageRequest = pageRequestService.loadPage(pageData);
        if(!pageRequest) return callback(new Error('failed to create pageData ' + JSON.stringify(pageData)));

        phantomService.loadPage(req.phantomServer, pageRequest, function(loadError, loadPage){
          waterfallCallback(loadError, loadPage);
        })
      },

      //pdf the page and save the scraped data+pdf url
      function(loadPage, waterfallCallback){
        phantomService.pdfPage(null, loadPage, pageData, function(pdfError, savedData){
          if (pdfError) return waterfallCallback(pdfError);

          mysqlService.saveListRecord(req.db, savedData, function (saveError) {
            waterfallCallback(saveError, loadPage);
          });
        })
      },

      //get attachment data
      function(loadPage, waterfallCallback){
        loadPage.evaluate(
          function(){return document.body.innerHTML},
          function(body){
            parsingService.readPageForAttachments(body, pageData, function(parseError, attachments) {
              waterfallCallback(parseError, loadPage, attachments);
            });
          }
        );
      },

      //save the attachment data
      function(loadPage, attachments, waterfallCallback){
        mysqlService.saveAttachRecord(req.db, attachments, function(saveError){
          waterfallCallback(saveError);
        })
      }
    ], eachCallback);
  }, callback);

};

exports.uploadScrapedPages = function(req, callback){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    s3Service.uploadPdf(req.s3, pageData, eachCallback);
  }, callback);
};