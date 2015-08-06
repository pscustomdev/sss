(function() {
    'use strict';
    
    angular
        .module('app')
        .config(config);
        
    config.$inject = ['$routeProvider'];
    
    function config($routeProvider) {
        $routeProvider
            .when('/sss', {
                templateUrl: '/js/app/sss/sss.html',
                controller: 'SSSController',
                controllerAs: 'vm'
            })
            .when('/snippet-overview/:snippetId', {
                templateUrl: '/js/app/sss/overview.html',
                controller: 'OverviewController',
                controllerAs: 'vm'
            })
            .when('/snippet-detail/:snippetId/:fileName', {
                templateUrl: '/js/app/sss/detail.html',
                controller: 'DetailController',
                controllerAs: 'vm'
            });
    } 

}());
