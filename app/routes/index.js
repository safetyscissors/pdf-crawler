var bodyParser = require('body-parser');
var server = require('./serverRoutes');
var domino = require('./dominoRoutes');
var mysqlService = require('../services/mysqlService');


exports.addRoutes = function(app){
  app.use(bodyParser.json({limit:1024*1024*100}));
  app.use(server.initPhantom, domino.auth, mysqlService.start);

  app.get('/', server.healthCheck);
  app.get('/unauth', domino.unauth);
  app.get('/scrapePages', domino.listing, domino.pdfPages);

  app.use(server.errorCheck);
};