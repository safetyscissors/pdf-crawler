var jsDom = require('node-jsdom');
var moment = require('moment');
var logger = require('winston');


/**
 * reads the raw html from domino listing page.
 * jumps to the first table and pulls relevant tds into a table
 * @param content
 * @param body
 * @param callback
 */
exports.readListing = function(content, body, baseUrl, callback){
  var headerRow = 0;
  var _this = this;
  var pages = [];

  //start jsDom and load it with jquery.
  jsDom.env(body, ["http://code.jquery.com/jquery.js"], function(domErrors, dom){

    //for each row of the dom. scrape the data and return it.
    dom.$('tr').each(function(cell, element){

      //skip the first row cause its a header
      if(headerRow == 0) return headerRow++;

      //define a function to pull data from the count of tds.
      var getTableCellValue = function(childId){
        var child = element._childNodes[childId];
        if(child._childNodes.length>0){
          return child._childNodes[0].innerHTML;
        }
        return null;
      };

      //create an object naming each field and extracting the url from a linked element.
      var listingData = {

        //change url to an absolute link
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

      //get domino id from the url
      getDominoId(listingData);

      //transform date from their respective formats to mysql format.
      setDates(listingData);

      pages.push(listingData)
    });

    dom.close();
    if (process.memoryUsage().heapUsed > 200000000) { //only call if memory use is bove 200MB
      logger.warn('[jsdom] dumping listing memory');
      global.gc();
    }
    //returns array of objects with relevant data.
    callback(domErrors, pages);
  });
};

/**
 * [HELPER] takes a domino url and pulls out the dominoId.
 * @param data
 */
function getDominoId(data){
  var urlPieces = data.url.split('/');
  data.dominoId = urlPieces.pop();
}

/**
 * [HELPER] takes the checkDate and the acceptedDate and converts both to mysql date formats. YYYY-MM-DD HH:mm:ss
 * @param data
 */
function setDates(data){

  //check date comes in mm/dd/yyyy.
  if(data.checkDate && data.checkDate.length>0){
    var checkDate = moment(data.checkDate, 'MM/DD/YYYY');
    if(!checkDate.isValid()){
      if(data.checkDate !== 'n/a') {
        logger.warn('[check date] ' + data.checkDate + ' was invalid for ' + data.dominoId, data);
      }
      data.checkDate = null;
    }else {
      data.checkDate = checkDate.format('YYYY-MM-DD HH:mm:ss');
    }
  }

  //accepted date comes in mm/dd/yyyy hh:mm:ss [am/pm]
  if(data.dateAccepted && data.dateAccepted.length>0){
    var acceptedDate = data.dateAccepted.split(' ');

    //if pm and hour is < 12, add 12 hours to the time.
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
      logger.warn('[accepted date] ' + data.dateAccepted + ' was invalid for ' + data.dominoId, data);
      data.dateAccepted = null;
    }else {
      data.dateAccepted = acceptedDate.format('YYYY-MM-DD HH:mm:ss');
    }
  }
}

/**
 * takes a page's raw html and returns a list of links on the page that are attachments.
 * @param body
 * @param listingData
 * @param callback
 */
exports.readPageForAttachments = function(body, listingData, baseUrl, callback){
  var _this = this;
  var attachments = [];

  //start jsDom and load it with jquery.
  jsDom.env(body, ["http://code.jquery.com/jquery.js"], function(domErrors, dom) {
    dom.$('a').each(function(link,element){
      var attachObj = {};

      //if link is listing home link, skip.
      if(element.href.indexOf('+Home') > -1) return;

      //if link is attachments, go deeper and pull those links
      if(element.innerHTML.toLowerCase().indexOf('file attachment') > -1){
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

    dom.close();
    if (process.memoryUsage().heapUsed > 200000000) { //only call if memory use is bove 200MB
      logger.warn('[jsdom] dumping attachment memory');
      global.gc();
    }

    callback(domErrors, attachments);
  });
};

/**
 * Compares base urls ignoring the id information.
 * @param url
 * @returns {boolean}
 */
exports.urlMatch = function(templateUrl, url){
  templateUrl = templateUrl.split('/').slice(0,-1).join('/');
  templateUrl = templateUrl.replace(/[^a-zA-Z0-9]/g, '');

  var cleanUrl = url.split('/').slice(0,-1).join('/');
  cleanUrl = cleanUrl.replace(/[^a-zA-Z0-9]/g, '');

  return (cleanUrl == templateUrl);
};