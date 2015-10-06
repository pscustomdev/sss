(function() {
    'use strict';

    angular.module('app.results', ['ui.router', 'app.searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('ResultsController', Controller);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['$rootScope', 'searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('results', {
            url: '/results',
            views: {
                '': {
                    templateUrl: '/js/app/sss/results/view.html',
                    controller: 'ResultsController'
                },
                'total@results': { templateUrl: '/js/app/sss/results/total_partial.html' },
                'sort@results': { templateUrl: '/js/app/sss/results/sort_partial.html' },
                'search@results': {
                    templateUrl: '/js/app/sss/results/search_partial.html',
                    controller: 'ResultsController'
                },
                'results@results': { templateUrl: '/js/app/sss/results/results_partial.html' },
                'filter_categories@results': { templateUrl: '/js/app/sss/results/filter_categories_partial.html' },
                'filter_tags@results': { templateUrl: '/js/app/sss/results/filter_tags_partial.html' },
                'filter_ratings@results': { templateUrl: '/js/app/sss/results/filter_ratings_partial.html' },
                'filter_search_criteria@results': { templateUrl: '/js/app/sss/results/filter_search_criteria_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        $scope.searchService = SearchService;
    }
}());