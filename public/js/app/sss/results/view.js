(function() {
    'use strict';

    angular.module('app.results', ['ui.router', 'app.searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('ResultsController', Controller)
        .directive('showMoreDirective', showMoreDirective);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['$rootScope', 'searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('results', {
            url: '/results',
            views: {
                '': {
                    templateUrl: '/js/app/sss/results/view.html'
                },
                'total@results': {
                    templateUrl: '/js/app/sss/results/total_partial.html',
                    controller: 'ResultsController'
                },
                'sort@results': { templateUrl: '/js/app/sss/results/sort_partial.html' },
                'search_bar@results': {
                    templateUrl: '/js/app/sss/results/search_bar_partial.html',
                    controller: 'ResultsController'
                },
                'results@results': {
                    templateUrl: '/js/app/sss/results/results_partial.html',
                    controller: 'ResultsController'
                },
                'categories_filter@results': { templateUrl: '/js/app/sss/results/categories_filter_partial.html' },
                'tags_filter@results': { templateUrl: '/js/app/sss/results/tags_filter_partial.html' },
                'ratings_filter@results': { templateUrl: '/js/app/sss/results/ratings_filter_partial.html' },
                'search_criteria_filter@results': {
                    templateUrl: '/js/app/sss/results/search_criteria_filter_partial.html',
                    controller: 'ResultsController'
                },
                'pagination@results': { templateUrl: '/js/app/sss/results/pagination_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        $scope.searchService = SearchService;
    }

    function showMoreDirective() {
        return function() {
            $('.show-more').showMore({
                adjustHeight: 40,
                moreText: "+ More",
                lessText: "- Less"
            });
        };
    }
}());