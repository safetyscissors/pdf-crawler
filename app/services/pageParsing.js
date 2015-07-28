var jsDom = require('node-jsdom');

exports.extractDiv = function(content, body, callback){
  var headerRow = 0;
  var _this = this;
  var baseUrl = 'https://bugfixdev.r7.rcuh.com';
  var pages = [];
  jsDom.env(body, ["http://code.jquery.com/jquery.js"], function(domErrors, dom){
    dom.$('a').each(function(link,element){
      if(_this.urlMatch(element.href)){
        var fileUrl = element.href.replace('file://', baseUrl);

      }
    });

    dom.$('tr').each(function(cell, element){
      if(headerRow == 0) return headerRow++;

      var listingData = {
        url:element._childNodes[12]._childNodes[0]._childNodes[0].href.replace('file://', baseUrl),
        dominoId:element._childNodes[12]._childNodes[0]._childNodes[0].innerHTML,
        documentNumber:element._childNodes[2]._childNodes[0].innerHTML,
        projectNumber:element._childNodes[3]._childNodes[0].innerHTML
      };

      pages.push(listingData)
    });


    callback(domErrors, pages);
  });
};

exports.urlMatch = function(url){
  var templateUrl = 'file:///000168d/rcuh6.nsf/Payment+Docs/Final+Info/E05B18044A9F3A760A257C600068B0F0';
  templateUrl = templateUrl.split('/').slice(0,-1).join('/');
  templateUrl = templateUrl.replace(/[^a-zA-Z0-9]/g, '');

  var cleanUrl = url.split('/').slice(0,-1).join('/');
  cleanUrl = cleanUrl.replace(/[^a-zA-Z0-9]/g, '');

  return (cleanUrl == templateUrl);
};