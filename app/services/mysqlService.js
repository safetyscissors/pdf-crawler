var mysql = require('mysql');
var async = require('async');
var _ = require('underscore');

exports.start = function(req,res,next){
  var db = mysql.createConnection(require('../config/mysqlLogin'));
  req.db  = db;

  db.connect(function(dbError){
    return next(dbError);
  })
};


exports.getNextRecordsToScrape = function(db, listUrl, callback){
  var increment = 10;

  db.beginTransaction(function(transErr){
    if(transErr) return callback(transErr);

    db.query('SELECT * FROM test.scrape_list_data WHERE current_list_url = "' + listUrl + '";', function(selectErr, selectResult){
      if(selectErr) return db.rollback(function(){ callback(selectErr) });

      db.query('UPDATE scrape_list_data SET current_list_index = current_list_index + ' + increment + ' WHERE current_list_url = "' + listUrl + '";', function(updateErr, updateResult){
        if(updateErr) return db.rollback(function(){ callback(updateErr) });

        db.commit(function(commitErr){
          return callback(updateErr, selectResult, increment);
        });
      });
    });
  });
};

exports.saveListRecord = function(db, page, callback){
  var keys = _.keys(page).join(',');
  var values = _.values(page).join(',');
  db.query('INSERT INTO scrape_file_data ('+keys+') VALUES ('+values+')', function(insertErr, insertResult){
    callback(insertErr);
  });
};