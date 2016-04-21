(function() {
    'use strict';

    angular.module('app.search', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider]);

    StateProvider.$inject = ['$stateProvider'];

    function StateProvider(stateProvider) {
        stateProvider.state('search', {
            url: '/search',
            data: {
                displayName: 'Search'
            },
            views: {
                '': {
                    templateUrl: '/app/views/search.html' }
            }
        })
    }
}());