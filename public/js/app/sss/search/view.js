(function() {
    'use strict';

    angular.module('app.search', ['ui.router', 'app.searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('SearchController', Controller);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['$rootScope', 'searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('search', {
            url: '/search',
            views: {
                '': {
                    controller: 'SearchController',
                    templateUrl: '/js/app/sss/search/view.html'
                },
                'total@search': { templateUrl: '/js/app/sss/search/total_partial.html' },
                'sort@search': { templateUrl: '/js/app/sss/search/sort_partial.html' },
                'search@search': {
                    templateUrl: '/js/app/sss/search/search_partial.html',
                    controller: 'SearchController'
                },
                'categories@search': { templateUrl: '/js/app/sss/search/categories_partial.html' },
                'filters@search': { templateUrl: '/js/app/sss/search/filters_partial.html' },
                'results@search': { templateUrl: '/js/app/sss/search/results_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        // Add searchService to $rootScope so it will be available on the page
        $scope.searchService = SearchService;
    }
}());