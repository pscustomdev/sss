(function() {
    'use strict';

    angular.module('app.main', ['ui.router', 'app.searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('MainController', Controller);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['$rootScope', 'searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('main', {
            url: '/main',
            views: {
                '': {
                    templateUrl: '/js/app/sss/main/view.html',
                    controller: 'MainController',
                    controllerAs: 'vm'
                },
                'search@main': { templateUrl: '/js/app/sss/main/search_partial.html' }
            }
        })
    }

    function Controller($scope, SearchService) {
        //var vm = this;

        $scope.searchService = SearchService; // Add SearchService to $rootScope so it will be available on the page
    }
}());