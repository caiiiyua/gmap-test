(function() {
	var app = angular.module('myapp', ['ngMap']);
	app.controller('MainController', function() {
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

	cities = [
		"Paris",
		"London",
		"Berlin",
		"Roman"
	];
})();