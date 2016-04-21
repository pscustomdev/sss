(function() {
    'use strict';

    angular.module('app.sss', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider]);
    StateProvider.$inject = ['$stateProvider'];

    function StateProvider(stateProvider) {
        stateProvider.state('asdasd', {
            url: '/sss',
            abstract: true,
            template: '/app/views/sss.html'
        }).state('search', {
            url: '',
            data: {
                displayName: 'Search'
            },
            templateUrl: '/app/views/search.html'
        });
    }
}());

