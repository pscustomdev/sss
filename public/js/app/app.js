(function() {
    'use strict';

    // Declare app level module which depends on views, and components
    angular.module('app', [
            'ui.router',
            'app.angularService',
            'app.searchService',
            'app.search',
            'app.results'
        ])
        .config(['$urlRouterProvider',
            function($urlRouterProvider) {
                $urlRouterProvider.otherwise('/search');    // Sets default view to render
            }
        ])
        .directive('ngEnter', function() {
            return function(scope, element, attrs) {
                element.bind("keydown keypress", function(event) {
                    if(event.which === 13) {
                        scope.$apply(function(){
                            scope.$eval(attrs.ngEnter, {'event': event});
                        });

                        event.preventDefault();
                    }
                });
            };
        })
        .run(
            function ($rootScope, $state, $stateParams, $log) {
                $rootScope.$log = $log;
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
            }
        );

}());