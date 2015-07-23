var bodyParser = require('body-parser');
var server = require('./serverRoutes');
var domino = require('./dominoRoutes');

exports.addRoutes = function(app){
  app.use(bodyParser.json({limit:1024*1024*100}));
  app.use(server.init);

  app.get('/', server.healthCheck);
  app.get('/auth', domino.auth);
  app.get('/unauth', domino.unauth);
  app.get('/listing', domino.listing);

  app.use(server.errorCheck);
};