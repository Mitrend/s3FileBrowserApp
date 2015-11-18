( function () {
	'use strict';

	var zips = [
		'html',
		'html',
	]

	app.controller( 'HomeCtrl', [ '$scope', '$http',
		function ( $scope, $http ) {
			// $scope.d = {}
			$scope.fileViewer = 'Please select a file to view its contents';
			$scope.subSource = "Welcome to your utopia file browser: Mitrend 53";
			$scope.inProgress = false
			$scope.base = undefined

			$scope.dev = function ( idk ) {
				console.info( 'dwadwad' )
			}


			$scope.tree_core = {

				multiple: false, // disable multiple node selection

				check_callback: function ( operation, node, node_parent, node_position, more ) {
					if ( operation === 'move_node' ) {
						return false; // disallow all dnd operations
					}
					return true; // allow all other operations
				}
			};



			$scope.downloadFile = function () {
				if ( _.isUndefined( $scope.base ) ) {
					return
				}
				$http.post( 'http://192.168.50.186:7564/api/download', {
					base: $scope.base
				} ).success( function ( res ) {
					window.location.assign( res )
				} )

			}



			$scope.nodeSelected = function ( e, data ) {
				var _l = data.node.li_attr;

				if ( _l.isLeaf ) {

					$scope.base = _l.base
					var liBase = _l.base.lastIndexOf( '/' )
					var file = _l.base.substring( liBase + 1, _l.base.length )

					var liFile = file.lastIndexOf( '.' )
					var fName = file.substring( 0, liFile )
					var ext = file.substring( liFile + 1, file.length )

					$scope.file = file
					$scope.inProgress = true

					if ( ext == 'html' ) {
						console.warn( 'getting resource' )
						window.open( '/api/resource/' + _l.base )
					}


					$http.post( 'http://192.168.50.186:7564/api/view', {
						base: _l.base
					} ).success( function ( res ) {
						$scope.file = file
						if ( ext == 'json' ) {
							res = JSON.stringify( res, true, 4 )
						}
						$scope.subSource = res
						$scope.inProgress = false
					} )


				}
			};
		}
	] );

}() );

