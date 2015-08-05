var jsDom = require('node-jsdom');
var moment = require('moment');
exports.readListing = function(content, body, callback){
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

      var getTableCellValue = function(childId){
        var child = element._childNodes[childId];
        if(child._childNodes.length>0){
          return child._childNodes[0].innerHTML;
        }
        return null;
      };

      var listingData = {
        url:element._childNodes[12]._childNodes[0]._childNodes[0].href.replace('file://', baseUrl),
        requestNumber:element._childNodes[12]._childNodes[0]._childNodes[0].innerHTML,
        documentNumber:getTableCellValue(2),
        projectNumber:getTableCellValue(3),
        vendorName:getTableCellValue(4),
        amount:getTableCellValue(5),
        checkDate:getTableCellValue(7),
        checkNo:getTableCellValue(8),
        dateAccepted:getTableCellValue(9),
        principalInvestigator:getTableCellValue(10),
        foCode:getTableCellValue(11)
      };

      getDominoId(listingData);
      setDates(listingData);

      pages.push(listingData)
    });

    callback(domErrors, pages);
  });
};

function getDominoId(data){
  var urlPieces = data.url.split('/');
  data.dominoId = urlPieces.pop();
}

function setDates(data){
  //check date comes in mm/dd/yyyy.
  if(data.checkDate && data.checkDate.length>0){
    var checkDate = moment(data.checkDate, 'MM/DD/YYYY');
    if(!checkDate.isValid()){
      console.log(data.checkDate, ' was invalid for ', data.dominoId);
      data.checkDate = null;
    }else {
      data.checkDate = checkDate.format('YYYY-MM-DD HH:mm:ss');
    }
  }

  //accepted date comes in mm/dd/yyyy hh:mm:ss [am/pm]
  if(data.dateAccepted && data.dateAccepted.length>0){
    var acceptedDate = data.dateAccepted.split(' ');
    if(acceptedDate.pop().toLowerCase() == 'pm'){
      var acceptedDateTime = (acceptedDate.pop()).split(':');
      if(acceptedDateTime[0] <= 11) {
        acceptedDateTime[0] = Number(acceptedDateTime[0]) + 12;
      }
      acceptedDate.push(acceptedDateTime.join(':'));
    }
    acceptedDate = acceptedDate.join(' ');
    acceptedDate = moment(acceptedDate, 'MM/DD/YYYY HH:mm:ss');
    if(!acceptedDate.isValid()){
      console.log(data.dateAccepted, ' was invalid for ', data.dominoId);
      data.dateAccepted = null;
    }else {
      data.dateAccepted = acceptedDate.format('YYYY-MM-DD HH:mm:ss');
    }
  }
}

exports.readPageForAttachments = function(body, listingData, callback){
  var _this = this;
  var attachments = [];
  var baseUrl = 'https://bugfixdev.r7.rcuh.com';


  jsDom.env(body, ["http://code.jquery.com/jquery.js"], function(domErrors, dom) {
    dom.$('a').each(function(link,element){
      var attachObj = {};

      //if link is listing home link, skip.
      if(element.href.indexOf('+Home') > -1) return;

      //if link is attachments, go deeper and pull those links
      if(element.innerHTML.toLowerCase().indexOf('file attachment') > -1){
        console.log('attachment:', element.href, ' document:', listingData.dominoId );
        attachObj.href= element.href;
        attachObj.url = listingData.url;
        attachObj.type= 'file';
        attachObj.dominoId = listingData.dominoId;
      }

      //if link is a sub page, scrape it too
      else{
        attachObj.href= element.href;
        attachObj.url = listingData.url;
        attachObj.type= 'javascript';
        attachObj.dominoId = listingData.dominoId;
      }

      attachments.push(attachObj);
    });

    callback(domErrors, attachments);
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