( function () {
	'use strict';

	var _ = require( 'lodash' );
	var express = require( 'express' );
	var path = require( 'path' );
	var logger = require( 'morgan' );
	var cookieParser = require( 'cookie-parser' );
	var bodyParser = require( 'body-parser' );

	var routes = require( './routes.js' );

	var app = express();

	// view engine setup
	app.set( 'views', path.join( __dirname, 'views' ) );
	app.engine( 'html', require( 'ejs' ).renderFile );
	app.set( 'view engine', 'html' );

	// we need CORS for the REST API
	// app.all( '*', function ( req, res, next ) {
	// 	// res.header( "Content-Type", "*" );
	// 	res.header( "Access-Control-Allow-Origin", "*" );
	// 	res.header( "Access-Control-Allow-Headers", "Content-Type,X-Requested-With" );
	// 	res.header( "Access-Control-Allow-Methods", 'GET,POST,PUT,HEAD,DELETE,OPTIONS' );
	// 	next();
	// } );

	app.use( logger( 'dev' ) );
	app.use( bodyParser.json() );
	app.use( bodyParser.urlencoded( {
		extended: true
	} ) );
	app.use( cookieParser() );

	app.use( express.static( path.join( __dirname, '../client' ) ) );

	app.use( '/', routes );

	app.set( 'port', 5353 );

	var server = app.listen( app.get( 'port' ), function () {
		console.log( 'Express server listening on port ' + server.address().port );
	} );

	module.exports = app;
}() );

