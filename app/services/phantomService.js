var phantom = require('phantom');
var queryString = require('querystring');
var _ = require('underscore');


/**
 * Loads a page from a pageLoadRequest.
 * phantom.createPage, page.open, returns callback.
 * @param phantomServer
 * @param request   //{url:'', method:'', *data:{}}
 * @param callback  //(error, *page);
 * @returns {*}
 */
exports.loadPage = function(phantomServer, requestObj, callback){
  if(!_.has(requestObj, 'historic_original_url')) return callback(new Error('[phantomService] request missing url'));
  if(!_.has(requestObj, 'method')) return callback(new Error('[phantomService] request missing method'));

  phantomServer.createPage(function(page) {
    //once page is opened, check for failed, then continue
    var processPage = function (status) {
      var error = (status !== 'success') ? (new Error('[phantomService] failed phantom page load. status:' + status)) : null;
      callback(error, page)
    };

    //if get, give less arguments
    if (requestObj.method.toLowerCase() == 'get') {
      page.open(requestObj.historic_original_url, requestObj.method, processPage)
    } else {
      page.open(requestObj.historic_original_url, requestObj.method, queryString.stringify(requestObj.data), processPage)
    }
  });
};

/**
 * Part of init. Starts phantom server.
 * Adds to req.phantomServer.
 * @param req
 * @param callback
 */
exports.startServer = function(req, callback){
  var options = {parameters: {'ignore-ssl-errors': true, 'ssl-protocol':'any'}};
  phantom.create(function(phantomServer){
    req.io.emit('alert','phantom server started');
    req.phantomServer = phantomServer;
    callback();
  }, options);
};

/**
 * Given a loaded page, renders a pdf and save to 'app/pdfs'.
 * Also names file 'archive-dominoId-projectNumber-timestring.jpg'
 * @param loadError
 * @param loadPage
 * @param pageData
 * @param callback
 * @returns {*}
 */
exports.pdfPage = function(loadPage, pageData, callback){
  var dirName = 'app/pdfs/';
  var fileName =  'archive-'+pageData.dominoId + '-' + pageData.projectNumber + '-' +  (new Date).getTime() + '.pdf';

  pageData['pdfName'] = fileName;

  loadPage.render(dirName + fileName, function(){
    return callback(null, pageData)
  });
};
