(function() {
    'use strict';
    angular.module('app.results', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize'])
        .config(['$stateProvider', StateProvider])
        .controller('SearchBarFilteringController', SearchBarFilteringController)
        .controller('ResultsController', ResultsController)
        .controller('SearchCriteriaController', SearchCriteriaController)
        .directive('showMoreDirective', showMoreDirective);

    StateProvider.$inject = ['$stateProvider'];
    SearchBarFilteringController.$inject = ['$scope'];
    ResultsController.$inject = ['$scope'];
    SearchCriteriaController.$inject = ['$scope'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.results', {
            url: '/results',
            data: {
                displayName: 'Results'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/results.html', controller: 'ResultsController'}
            }
        })
    }

    function SearchBarFilteringController($scope) {
        // ToDo: Get counts from a periodic check against the repository
        $scope.results_filter = {
            templateUrl: 'results_filter.html',
            categories: [
                { displayValue: 'Active Directory', active: true, count: 1 },
                { displayValue: 'IDM', active: true, count: 4 },
                { displayValue: 'Policy', active: true, count: 2 }
            ],
            tags: [
                { displayValue: 'Javascript', active: true, count: 1 },
                { displayValue: 'Formula', active: true, count: 4 }
            ],
            ratings: [
                { displayValue: '* * * * *', active: true, count: 4 },
                { displayValue: '* * * *', active: true, count: 2 },
                { displayValue: '* * *', active: true, count: 0 },
                { displayValue: '* *', active: true, count: 0 },
                { displayValue: '*', active: true, count: 0 }
            ]
        };
    }

    function ResultsController($scope) {
        // Rating
        $scope.avgRatingOptions = {
            ratedFill: '#337ab7',
            readOnly: true,
            halfStar: true,
            starWidth: "20px"
        };
    }

    function SearchCriteriaController($scope) {
        // ToDo: Get customTags from search results
        $scope.search_criteria = [
            { displayValue: 'javascript', active: true, count: 0 },
            { displayValue: 'idm', active: true, count: 35},
            { displayValue: 'searchterm3', active: true, count: 7 }
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