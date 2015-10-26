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
                    templateUrl: '/js/app/sss/search/view.html',
                    controller: 'SearchController'
                },
                'search_bar@search': { templateUrl: '/js/app/sss/search/search_bar_partial.html' },
                'top_hits@search': { templateUrl: '/js/app/sss/search/top_hits_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        $scope.searchService = SearchService;
    }
}());

