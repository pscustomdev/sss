(function() {
    'use strict';

    // Declare app level module which depends on views, and components
    angular.module('app', [
            'ui.router',
            'app.angularService',
            'app.searchService',
            'app.search',
            'app.results',
            'app.overview',
            'app.details'
        ])
        .config(['$urlRouterProvider',
            function($urlRouterProvider) {
                $urlRouterProvider.otherwise('/search');
            }
        ]).run(
            function ($rootScope, $state, $stateParams) {
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
            }
        );
}());