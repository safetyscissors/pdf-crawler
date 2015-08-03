var mysql = require('mysql');
var async = require('async');
var _ = require('underscore');

exports.initDb = function(req,res,next){
  var db = mysql.createConnection(require('../config/mysqlLogin'));
  req.db  = db;

  db.connect(function(dbError){
    return next(dbError);
  })
};


exports.getNextRecordsToScrape = function(db, listUrl, callback){
  var increment = 10;
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
    callback(error, currentIndex, increment);
  });
};

exports.saveListRecord = function(db, page, callback){
  var keys = _.keys(page).join(',');
  var values = _.values(page);
  var placeHolders = new Array(values.length-1);
  placeHolders.push('?');
  placeHolders = placeHolders.join('?, ');
  var sql = 'INSERT INTO scrape_file_data ('+keys+') VALUES ('+placeHolders+')';
  db.query('INSERT INTO scrape_file_data ('+keys+') VALUES ('+placeHolders+')', values, function(insertErr, insertResult){
    callback(insertErr);
  });
};