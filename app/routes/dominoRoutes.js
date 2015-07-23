var pageRequestService = require('../services/pageLoadRequests');
var phantomService = require('../services/phantomService');
var async = require('async');
var _ = require('underscore');

exports.unauth = function(req, res, next){};

exports.listing = function(req, res, next){};

exports.auth = function(req, res, next){
  if(!_.has(req, 'phantomServer')) return next(new Error('[dominoRoutes] missing phantomService'));

  //setup auth request
  var authRequest = pageRequestService.authenticate();

  //send request
  phantomService.loadPage(req.phantomServer, authRequest, function(loadError, loadPage){
    loadPage.render('test.jpg');
    res.send('done');
  });

  //send request

  //process auth


/*
  var loginRequest = {
    url:'https://bugfixdev.r7.rcuh.com/names.nsf?Login',
    method:'post',
    data:{username:'accounting', password:'devrepair1'}
  };

  loadService.phantomLoad(loginRequest, function(a,b){
    var listingurl = 'https://bugfixdev.r7.rcuh.com/000168d/rcuh6.nsf/Payment+Docs/Final+Central';
    var getparams = '?OpenView&Count=1000';
res.send('done');

  });*/
};
