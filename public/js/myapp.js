(function() {
	// var app = angular.module('myapp', ['ngMap']);
	var app = angular.module('myapp', ['ngRoute']);
	app.config(['$routeProvider', function ($routeProvider) {
		$routeProvider.when('/gmap', {
			templateUrl: '/html/partials/gmap-test.html',
			controller: 'GMapCtrl'
		})
		.when('/login', {
			templateUrl: '/html/partials/login.html',
			controller: 'LoginCtrl'
		})
		.when('/signup', {
			templateUrl: '/html/partials/signup.html',
			controller: 'SignupCtrl'
		})
		.otherwise({ redirectTo: '/index.html' });
	}]);

	app.controller('MainController', function() {
		// this.current = 1;
		this.isActive = function(page) {
			return this.current === page;
		};

		this.setActive = function(page) {
			this.current = page;
		};
	});

	app.controller('GMapCtrl', function () {
		this.location = "London";

		this.origin = "Paris";
		this.destination = "Berlin";

		this.current = 2;
		this.setTab = function(tab) {
			this.current = tab;
		};

		this.isTab = function(tab) {
			return this.current === tab;
		};
	});

	app.controller('LoginCtrl', ['$scope', function ($scope) {
		$scope.user = "";
		$scope.password = "";
	}]);
	app.controller('SignupCtrl', ['$scope', function ($scope) {
		$scope.user = "";
		$scope.password = "";
	}]);

	// services - GoogleMap
	app.factory('googleMap', ['$rootScope', function ($rootScope) {
		var factory = {};

		factory._maps = google.maps;
		factory.marker = [];
		factory.selectedMarkIdx = null;
		factory.icons = {};
		factory.mapWidth = 0;
		factory.iconNameTmpl = "/img/marks/0.png";

		factory.intializeMap = function(elem, options) {
			options = options || {
				zoom: 10,
				center: new google.maps.LatLng(21.508742, -0.120850),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoomControlOption: {
					position: google.maps.ControlPostion.LEFT_TOP
				},
				panControlOption: {
					postion: google.maps.ControlPosition.LEFT_TOP
				}
			};

			if (this.map) {
				delete this.map;
				this.selectedMarkIdx = null;
			};

			var map = this.map = new google.maps.Map(elem, options);
			if (elem.clientWidth > 0) {
				this.mapWidth = elem.clientWidth;
			};
			return map;
		};

		/**
         * [getGeoCoder - gets a new geoCoder object]
         * @return {[type]}
         */
        factory.getGeoCoder = function () {
            return new google.maps.Geocoder();
        };

        /**
         * [initPlacesService - initialise the place service on a given map object]
         * @param  {object} map
         * @return {object}
         */
        factory.initPlacesService = function (map) {
            this.placeService = new google.maps.places.PlacesService(map);
            return this.placeService;
        };

        /**
         * [getIcon - Return the icon object used by google.maps.Marker calls]
         * @param  {integer} num
         * @return {object}
         */
        factory.getIcon = function(num) {
            var i = this.icons['m' + num];
            if (typeof i === 'undefined' || i === null) {
                i = this.icons['m' + num] = {
                    url: factory.iconNameTmpl.format(num)
                };
            }
            return i;
        };

        /**
         * [placeMarkers description]
         * @param  {array} data
         * @return {void}
         */
        factory.placeMarkers = function (data) {
            this.clearAllMarkers();
            var me = this,
                bounds = new google.maps.LatLngBounds();
            var count = 1;
            angular.forEach(data, function (item, key) {
                var latLng = new google.maps.LatLng(item.geometry.location.lat(), item.geometry.location.lng()),
                    currentMarker;    
                me.markers.push(currentMarker =  new google.maps.Marker({
                    map: me.map,
                    position: latLng,
                    animation: google.maps.Animation.DROP,
                    icon: me.getIcon(count++)
                }));
                bounds.extend(latLng);
                google.maps.event.addListener(currentMarker, "click", function () {
                    me.selectedMarkerIdx = key;
                    $rootScope.$apply();
                });
            });
            me.map.fitBounds(bounds);
        };

        /**
         * [clearAllMarkers - clear all markers in the map]
         * @return {void}
         */
        factory.clearAllMarkers = function () {
            angular.forEach(this.markers, function (item, key) {
                item.setMap(null);
            });
            this.markers = [ ];
        };

        /**
         * [zoomToMarker - zoom to a marker on the map]
         * @param  {integer} marker index
         * @return {void}
         */
        factory.zoomToMarker = function(idx) {
            // Zoom to marker with proper zoom based on bounds.
            var p = this.markers[idx].getPosition();
            // cw: Would like to pan & zoom to this, but V3 API doesn't make this possible.
            this.map.setCenter(p);
            // cw: Zoom level determined by hand. Should be a better way.
            this.map.setZoom(16);
            // cw: Alternative -- find closest marker, add both points to bounds and zoom to 
            // that to show context.
        };

        /**
         * [bounceMarker - use the bounce animation on the marker]
         * @param  {[type]} idx [index of the marker in markers array]
         * @return {[type]}     [void]
         */
        factory.bounceMarker = function(idx){
            var marker  = this.markers[idx];
            angular.forEach(this.markers, function (item, key) {
                item.setAnimation(null);
            });
            marker && marker.setAnimation(google.maps.Animation.BOUNCE);
        };

		return factory;
	}]);

	app.factory('scrollToElem', function($window, $timeout) {
		return {
            scrollTo: function (elemId) {
                var elem = document.getElementById(elemId);
                if (!elem) {
                    $window.scrollTo(0, 0);
                    return;
                }
                $timeout(function () {
                    elem.scrollIntoView();
                }, 100);

            }
        };
	});

	// directives - GMap
	app.directive('gmap', ['googlemap', function (googlemap) {
		return {
			restrict: 'EA',
			link: function (scope, elem, attrs) {
				var map = googleMap.initializeMap(elem[ 0 ]),
                        markers = [ ];
                googleMap.initPlacesService(map);

                /**
                 * [renderMap - place the markers in the map ]
                 * @param  {[type]} mapData
                 * @return {[type]}
                 */
                var renderMap = function (mapData) {
                    if (!mapData) {
                        return;
                    }
                    googleMap.placeMarkers(mapData);
                };
                
                /*
                Keep watching the data and update the map
                 */
                scope.$watch("data", function (newval) {
                    googleMap.initializeMap(elem[ 0 ]);
                    renderMap(newval);
                });
			}
		};
	}]);

	cities = [
		"Paris",
		"London",
		"Berlin",
		"Roman"
	];
})();