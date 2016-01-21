var readChunk = require( 'read-chunk' )
var fileType = require( 'file-type' )
var _ = require( 'lodash' )
var stream = require( "stream" )
var archive = require( 'ls-archive' )



var express = require( 'express' );
var router = express.Router();
var fs = require( 'fs' );
var path = require( 'path' );
var config = require( '../config.json' );
var AWS = require( 'aws-sdk' );

console.log( config );

var s3 = new AWS.S3( config.aws );
/* GET home page. */
router.get( '/', function ( req, res ) {
	res.render( 'index' );
} );

/* Serve the Tree */
router.get( '/api/tree', function ( req, res ) {
	console.log( '/api/tree > req.query.id > ', req.query.id )
	var _p;
	if ( req.query.id == 1 ) {
		processReq( null, res );

	} else {
		if ( req.query.id ) {
			_p = req.query.id;
			processReq( _p, res );
		} else {
			res.json( [ 'No valid data found' ] );
		}
	}
} );

router.post( '/api/download', function ( req, res ) {
	var base = req.body.base
	console.log( '/api/download > base > ', base )

	var url = s3.getSignedUrl( 'getObject', {
		Bucket: config.bucket,
		Key: base
	} );

	return res.send( url )
} )


router.post( '/api/view', function ( req, res ) {
	var base = req.body.base
	console.log( '/api/view > base > ', base )

	req.stream = ''

	s3.getObject( {
		Bucket: config.bucket,
		Key: base
	}, function ( err, data ) {
		if ( err ) {
			console.error( err )
			res.end()
			return
		}

		console.log( 'data.ContentLength > ', data.ContentLength )

		if ( data.ContentLength > 10000000 ) {
			return res.send( 'requested file too big. data.ContentLength > 10000000' )
		}

		var buffer = new Buffer( data.Body )
		var type = fileType( buffer )

		if ( _.isNull( type ) ) {
			res.send( buffer.toString() )
		} else {

			var archiveTypes = [
				'epub',
				'jar',
				'love',
				'nupkg',
				'tar',
				'tar.gz',
				'tgz',
				'war',
				'zip',
				'egg',
				'whl',
				'xpi'
			]

			if ( _.includes( archiveTypes, type.ext ) ) {
				return res.send( 'archive viewing is not ready. but we know it\'s an archive! :D' )

			} else {
				type.file = base
				return res.send( type.file + '\n' + type.mime )
			}
		}
	} )

} )

router.get( '/static/*', function ( req, res ) {

	var base = req.params[ 0 ];

	// if it ends in a slash then check for index.html
	if(/\/$/.test(base)) base = base + 'index.html';

	var liBase = base.lastIndexOf( '.' )
	var ext = base.substring( liBase + 1, base.length )

	if ( ext == 'js' ) {

		req.stream = ''
		s3.getObject({
			Bucket: config.bucket,
			Key: base
		})
		.on('error', err => {
			console.log('Error with s3.getObject', err);
			res.sendStatus(err.statusCode);
		})
		.createReadStream()
		.on('data', function ( buffer ) {
			req.stream = req.stream + buffer
		})
		.on('end', function () {
			res.type( 'js' )
			if(req.stream) res.send( req.stream.replace( /[^\u000A\u0020-\u007E]/g, '' ) )
		});

	} else {
		console.log('Lookup ', base);
		s3.getObject({ Bucket: config.bucket, Key: base}, (err, data) => {
			if ( err ) {
				if(!/\/$/.test(base)) {
					// doesn't end with a slash
					s3.getObject({ Bucket: config.bucket, Key: base + '/index.html'}, (err2, data2) => {
						if(err2) res.sendStatus(err.statusCode);
						else  {
							// yea it doesn't end with a slash but has a index.html inside it
							console.log('Redirecting to:', base + '/');
							res.redirect('/static/' + base + '/');
						}
					});
				} else {
					res.sendStatus(err.statusCode);
				}
				
			} else {
				res.type( ext )
				res.send( data.Body )
			}

		} );

	}

} );

function processReq( prefix, res ) {
	var resp = [];
	s3.listObjects( {
		Bucket: config.bucket,
		Prefix: prefix,
		Delimiter: '/'
	}, function ( err, data ) {
		//Set breadcrumbs..
		if ( err ) {
			console.log( err );
			res.send( err );
			return;
		}
		var contents = data.Contents;
		var truncated = data.IsTruncated;
		var nextMarker = data.NextMarker;
		var currentFolder = '<a href="javascript:listObjects(\'\')"><span class="path">root</span></a>';
		var icon = '';

		//Set folders...
		var countFolders = 0;
		for ( var i = 0; i < data.CommonPrefixes.length; i++ ) {
			var currentPrefix = data.CommonPrefixes[ i ].Prefix;
			var name = ( currentPrefix.replace( prefix, '' ) ).replace( '/', '' );
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
			} );
		}

		for ( var i = 0; i < contents.length; i++ ) {
			var key = contents[ i ].Key;
			var size = Math.ceil( contents[ i ].Size / 1024 );
			var fileName = key.replace( prefix, '' );
			if ( prefix !== key ) {
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
				resp.push( folder );
			}
		}
		res.json( resp );
	} );
}

function processNode( _p, f ) {
	return {
		"id": _p ? path.join( _p, f.Key ) : f,
		"text": f.Key,
		"icon": s.isDirectory() ? 'jstree-custom-folder' : 'jstree-custom-file',
		"state": {
			"opened": false,
			"disabled": false,
			"selected": false
		},
		"li_attr": {
			"base": path.join( _p, f ),
			"isLeaf": !s.isDirectory()
		},
		"children": s.isDirectory()
	};
}

module.exports = router;
