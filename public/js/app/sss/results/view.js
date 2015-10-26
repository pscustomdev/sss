(function() {
    'use strict';

    angular.module('app.results', ['ui.router', 'app.searchService', 'ngAnimate', 'ui.bootstrap'])
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
                    templateUrl: '/js/app/sss/results/view.html',
                    controller: 'ResultsController'
                },
                'total@results': { templateUrl: '/js/app/sss/results/total_partial.html' },
                'sort@results': { templateUrl: '/js/app/sss/results/sort_partial.html' },
                'search_bar@results': { templateUrl: '/js/app/sss/results/search_bar_partial.html' },
                'results@results': { templateUrl: '/js/app/sss/results/results_partial.html' },
                'search_criteria_filter@results': { templateUrl: '/js/app/sss/results/search_criteria_filter_partial.html' },
                'pagination@results': { templateUrl: '/js/app/sss/results/pagination_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        $scope.searchService = SearchService;

        // ToDo: Get counts from a periodic check against the repository
        $scope.results_filter = {
            templateUrl: 'results_filter.html',
            categories: [
                { active: true, displayValue: 'Active Directory', count: 1 },
                { active: true, displayValue: 'IDM', count: 4 },
                { active: true, displayValue: 'Policy', count: 2 }
            ],
            tags: [
                { active: true, displayValue: 'Javascript', count: 4 },
                { active: true, displayValue: 'Formula', count: 0 }
            ],
            ratings: [
                { active: true, displayValue: '* * * * *', count: 4 },
                { active: true, displayValue: '* * * *', count: 2 },
                { active: true, displayValue: '* * *', count: 0 },
                { active: true, displayValue: '* *', count: 0 },
                { active: true, displayValue: '*', count: 0 }
            ]
        };

        $scope.results_sorts = [
            { active: true, displayValue: 'Date' },
            { active: true, displayValue: 'Rating' },
            { active: true, displayValue: '# Views' }
        ];

        // ToDo: Get customTags from search results
        $scope.search_criteria = [
            { active: true, displayValue: 'javascript', count: 0 },
            { active: true, displayValue: 'idm', count: 35 },
            { active: true, displayValue: 'searchterm3', count: 7 }
        ];
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