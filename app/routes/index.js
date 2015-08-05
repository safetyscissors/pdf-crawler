var bodyParser = require('body-parser');
var server = require('./serverRoutes');
var domino = require('./dominoRoutes');
var mysqlService = require('../services/mysqlService');
var s3Service = require('../services/s3Service');
var casper = require('../services/casperService');


exports.addRoutes = function(app){
  app.use(bodyParser.json({limit:1024*1024*100}));
  app.use(server.initPhantom, domino.auth, mysqlService.initDb, s3Service.initS3);

  app.get('/raceTest', domino.raceTest);
  app.get('/', server.healthCheck);
  app.get('/unauth', domino.unauth);
  app.get('/scrapePages', domino.listing, domino.pdfPages, domino.uploadPages, domino.cleanUp);
  app.get('/testJs', domino.listing, domino.scrapePdf, domino.stopping);//domino.uploadPages, domino.cleanUp);

  app.get('/casper', domino.listing, casper.test, domino.stopping);
  app.use(server.errorCheck);
};