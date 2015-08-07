var pageRequestService = require('../services/pageLoadRequests');
var phantomService = require('../services/phantomService');
var parsingService = require('../services/pageParsing');
var mysqlService = require('../services/mysqlService');
var s3Service = require('../services/s3Service');
var async = require('async');
var _ = require('underscore');
var logger = require('winston');
var fs = require('fs');

exports.scrapeListing = function(req, callback){
  //setup list page
  pageRequestService.loadListing(req.db, function(dbError, listRequest, startPos){

    //send request
    phantomService.loadPage(req.phantomServer, listRequest, function(loadError, loadPage){
      if (loadError) return callback(loadError);

      //return all html
      loadPage.evaluate(
        function(){ return document.body.innerHTML },
        function(body){ parsingService.readListing('content', body, function(domError, pages){
          if (domError) return callback(domError);


          _.each(pages, function(element, index){
            element.listingId = req.counter + index;
          });

          req.listing = pages;
          loadPage.close();

          async.each(req.listing,

            //iterator
            function(page, eachCallback) {
              mysqlService.saveListRecord(req.db, page, function (saveError) {
                eachCallback(saveError);
              });
            },

            //done
            function(eachError){
              callback(eachError, startPos);
            }
          )
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
        loadPage.close();
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

exports.confirmFilePdfs = function(req, callback){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    var dir = 'app/pdfs/';
    fs.stat(dir+pageData.pdfName, function(fsErr, stat){
      if (stat.size <100000 || stat.size > 2000000){
        logger.warn('[confirm] whoa. ' + pageData.dominoId + ' had a file size of ' + stat.size);
      }
      eachCallback(fsErr)
    });
  }, callback);
};

exports.cleanUp = function(req, callback){
  async.eachSeries(req.listing, function(pageData, eachCallback){
    var dir = 'app/pdfs/';
    fs.unlink(dir+pageData.pdfName, function(fsErr){
      eachCallback(fsErr);
    });
  }, function(fsError){
    if(req.listing.length!=100){
      logger.warn('[cleanup] removed ' + req.listing.length + ' pages');
    }
    callback(fsError);
  })
};