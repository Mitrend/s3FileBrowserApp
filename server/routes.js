(function() {

  'use strict';
  var express = require('express');
  var router = express.Router();
  var fs = require('fs');
  var path = require('path');
  var config = require('../config.json');
  var AWS = require('aws-sdk');

 console.log(config);
  
  var s3 = new AWS.S3(config.aws);
  /* GET home page. */
  router.get('/', function(req, res) {
    res.render('index');
  });

  /* Serve the Tree */
  router.get('/api/tree', function(req, res) {
    var _p;
    if (req.query.id == 1) {
      processReq(null, res);

    } else {
      if (req.query.id) {
        _p = req.query.id;
        processReq(_p, res);
      } else {
        res.json(['No valid data found']);
      }
    }
  });

  /* Serve a Resource */
  router.get('/api/resource', function(req, res) {
    s3.getObject({Bucket: config.bucket, Key: req.query.resource}, function(err, data){
		if(err){
			console.err(err);
			res.err(err);
			return;
		}
		res.setHeader('Content-disposition', 'attachment; filename='+ req.query.resource);
		res.send(data.Body);
		
	});
  });

  function processReq(prefix, res) {
    var resp = [];
    s3.listObjects({Bucket: config.bucket, Prefix: prefix, Delimiter : '/' }, function(err, data) {
		//Set breadcrumbs..
		if(err){
			console.log(err);
			res.send(err);
			return;
		}
		var contents = data.Contents;
		var truncated = data.IsTruncated;
		var nextMarker = data.NextMarker;
		var currentFolder = '<a href="javascript:listObjects(\'\')"><span class="path">root</span></a>';
		var icon = '';

		//Set folders...
		var countFolders = 0;
		for (var i = 0; i < data.CommonPrefixes.length; i++) {
			var currentPrefix = data.CommonPrefixes[i].Prefix;
			var name = (currentPrefix.replace(prefix, '')).replace('/','');
			resp.push( {
					id: currentPrefix,
					text: name,
					icon: 'jstree-custom-folder',
					"state": {
						"opened": false,
						"disabled": false,
						"selected": false
				  	},
				  "li_attr": {
					"base": key,
					"isLeaf": false
				  },
				  "children": true
			});
		}
		
		for (var i = 0; i < contents.length; i++) {
			var key = contents[i].Key;
			var size = Math.ceil(contents[i].Size / 1024);
			var fileName = key.replace(prefix, '');
			if (prefix !== key) {
				var folder = {
					id: key,
					text: fileName,
					icon: 'jstree-custom-file',
					"state": {
						"opened": false,
						"disabled": false,
						"selected": false
				  	},
				  "li_attr": {
					"base": key,
					"isLeaf": true
				  },
				  "children": false
				}
				resp.push(folder);
			}
		}
		res.json(resp);
    });
  }

  function processNode(_p, f) {
    return {
      "id": _p ? path.join(_p, f.Key): f,
      "text": f.Key,
      "icon" : s.isDirectory() ? 'jstree-custom-folder' : 'jstree-custom-file',
      "state": {
        "opened": false,
        "disabled": false,
        "selected": false
      },
      "li_attr": {
        "base": path.join(_p, f),
        "isLeaf": !s.isDirectory()
      },
      "children": s.isDirectory()
    };
  }

  module.exports = router;

}());
