(function() {
    'use strict';

    angular.module('app.search', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider])
        .controller('SearchController', SearchController);

    StateProvider.$inject = ['$stateProvider'];
    SearchController.$inject = ['$scope', '$rootScope', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('search', {
            url: '/search',
            data: {
                displayName: 'Search'
            },
            views: {
                '': {
                    templateUrl: '/app/views/search.html', controller: 'SearchController' }
            }
        })
    }

    function SearchController($scope, $rootScope, $nodeServices) {
        $nodeServices.getUserRankings().then(
            function (result) {
                if (result) {
                    $scope.userRankings = result.data;
                }
            }
        )
    }
}());