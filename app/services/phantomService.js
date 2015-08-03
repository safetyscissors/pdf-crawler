var phantom = require('phantom');
var queryString = require('querystring');
var _ = require('underscore');


/**
 * Loads a page.
 * @param phantomServer
 * @param request   //{url:'', method:'', *data:{}}
 * @param callback  //(error, *page);
 * @returns {*}
 */
exports.loadPage = function(phantomServer, requestObj, callback){
  if(!_.has(requestObj, 'url')) return callback(new Error('[phantomService] request missing url'));
  if(!_.has(requestObj, 'method')) return callback(new Error('[phantomService] request missing method'));

  phantomServer.createPage(function(page) {
    //once page is opened, check for failed, then continue
    var processPage = function (status) {
      var error = (status !== 'success') ? (new Error('[phantomService] failed phantom page load. status:' + status)) : null;
      callback(error, page)
    };

    //if get, give less arguments
    if (requestObj.method.toLowerCase() == 'get') {
      page.open(requestObj.url, requestObj.method, processPage)
    } else {
      page.open(requestObj.url, requestObj.method, queryString.stringify(requestObj.data), processPage)
    }
  });
};

/**
 * Starts a server. Adds it to the request
 * @param req
 * @param callback
 */
exports.startServer = function(req, callback){
  var options = {parameters: {'ignore-ssl-errors': true, 'ssl-protocol':'any'}};
  phantom.create(function(phantomServer){
    req.phantomServer = phantomServer;
    callback();
  }, options);
};

exports.pdfPage = function(loadError, loadPage, pageData, callback){
  if(loadError) return callback(loadError);
  var dirName = 'app/pdfs/';
  var fileName =  'archive-'+pageData.dominoId + '-' + pageData.projectNumber + '-' +  (new Date).getTime() + '.jpg';

  pageData['pdfName'] = fileName;

  loadPage.render(dirName + fileName);

  return callback(null, pageData);
};
