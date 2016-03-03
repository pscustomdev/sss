(function() {
    'use strict';

    // Declare app level module which depends on views, and components
    angular.module('app', ['ui.router', 'ui.router.breadcrumbs', 'app.$searchService', 'app.search', 'app.results', 'app.overview', 'app.details', 'app.create'])
        .config(['$urlRouterProvider', URLRouteProvider])
        .directive('ngEnter', ngEnter)
        .run(main);

    URLRouteProvider.$inject = ['$urlRouterProvider'];
    main.$inject = ['$rootScope', '$searchService', '$state', '$stateParams', '$log'];

    function URLRouteProvider($urlRouterProvider) {
        $urlRouterProvider.otherwise('/search');    // Sets default view to render
    }

    function ngEnter() {
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
    }

    function main($rootScope, $searchService, $state, $stateParams, $log) {
        $rootScope.$log = $log;
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.$searchService = $searchService;
    }
}());