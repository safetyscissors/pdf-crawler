var express = require('express');
var router = express.Router();

//login as an admin user of the site
router.post('/auth', function(req, res, next){
  res.send('login')
});

module.exports = router;