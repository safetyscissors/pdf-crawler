var mysql = require('mysql');
var async = require('async');
var _ = require('underscore');
var logger = require('winston');
var config = require('../config/config.json');
/**
 * Creates a new db connection. returns a callback within the connect statement.
 * adds a req.db
 * @param req
 * @param res
 * @param next
 */
exports.initDb = function(req,res,next){
  var db = mysql.createConnection(require('../config/mysqlLogin'));
  req.db  = db;

  db.connect(function(dbError){
    return next(dbError);
  })
};

/**
 * safely gets the next incremented rows available.
 * @param db
 * @param listUrl
 * @param callback
 */
exports.getNextRecordsToScrape = function(db, listUrl, callback){
  var increment = config.server.interval;
  var currentIndex = 0;

  async.waterfall([

    //start transaction
    function(waterfallCallback){
      db.beginTransaction(function(beginErr){
        waterfallCallback(beginErr);
      });
    },

    //select current index
    function(waterfallCallback){
      db.query('SELECT * FROM test.scrape_list_data WHERE current_list_url = "' + listUrl + '";', function(selectErr, selectResult) {
        if (selectErr) return db.rollback(function(){ waterfallCallback(selectErr) });
        currentIndex = selectResult[0]['current_list_index'];
        waterfallCallback();
      });
    },

    //increment index
    function(waterfallCallback){
      db.query('UPDATE scrape_list_data SET current_list_index = current_list_index + ' + increment + ' WHERE current_list_url = "' + listUrl + '";', function(updateErr, updateResult) {
        if (updateErr) return db.rollback(function(){ waterfallCallback(updateErr) });
        waterfallCallback();
      });
    },

    //check for race condition
    function(waterfallCallback) {
      db.query('SELECT * FROM test.scrape_list_data WHERE current_list_url = "' + listUrl + '" AND current_list_index = "' + ( Number(currentIndex) + increment) + '";', function (checkErr, checkResult) {
        if(checkErr) return db.rollback(function(){ waterfallCallback(checkErr)});
        if(checkResult.length !==1) return db.rollback(function(){waterfallCallback(new Error('race condition met'))});
        waterfallCallback();
      });
    },

    //commit
    function(waterfallCallback){
      db.commit(function(commitErr){
        return waterfallCallback(commitErr);
      })
    }

    //finish waterfall
  ], function(error){
    logger.info('[mysql] starting set '+currentIndex+' - '+(Number(currentIndex)+Number(increment)));
    callback(error, currentIndex, increment);
  });
};

/**
 * Inserts a scraped records information.
 * this insert is called for each record
 * @param db
 * @param page
 * @param callback
 */
exports.saveListRecord = function(db, page, callback){
  var keys = _.keys(page).join(',');
  var values = _.values(page);
  var placeHolders = new Array(values.length-1);
  placeHolders.push('?');
  placeHolders = placeHolders.join('?, ');

  var sql = 'INSERT INTO scrape_file_data ('+keys+') VALUES ('+placeHolders+')';
  db.query(sql, values, callback);
};

/**
 * Inserts attachment data scraped from sub pages.
 * @param db
 * @param attachObj
 * @param callback
 */
exports.saveAttachRecord = function(db, attachObjs, callback){
  async.each(attachObjs, function(attachObj, eachCallback) {
    var keys = _.keys(attachObj).join(',');
    var values = _.values(attachObj);
    var placeHolders = new Array(values.length - 1);
    placeHolders.push('?');
    placeHolders = placeHolders.join('?, ');

    var sql = 'INSERT INTO scrape_attachment_data (' + keys + ') VALUES (' + placeHolders + ')';
    db.query(sql, values, eachCallback);
  },callback);
};