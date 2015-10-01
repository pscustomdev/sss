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
                    controller: 'SearchController',
                    controllerAs: 'vm'
                },
                'search@search': { templateUrl: '/js/app/sss/search/search_partial.html' },
                'topHits@search': { templateUrl: '/js/app/sss/search/topHits_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        $scope.searchService = SearchService;
    }
}());