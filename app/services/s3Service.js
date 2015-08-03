var s3 = require('s3');
var s3config = require('../config/s3Login');

exports.initS3 = function(req, res, next){
  var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: s3config
  });

  req.s3 = client;
  next();
};

exports.uploadPdf = function(client, file, callback){
  var params = {
    localFile: 'app/pdfs/' + file.pdfName,
    s3Params:{
      Bucket:s3config.bucketName,
      Key:'historic/'+file.pdfName
    }
  };

  var uploader = client.uploadFile(params)
    .on('error',function(err){
      callback(err);
    })
    .on('end', function(){
      callback();
    });
};