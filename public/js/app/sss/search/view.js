(function() {
    'use strict';

    angular.module('app.search', ['ui.router', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider]);

    StateProvider.$inject = ['$stateProvider'];

    function StateProvider(stateProvider) {
        stateProvider.state('search', {
            url: '/search',
            views: {
                '': {
                    templateUrl: '/js/app/sss/search/view.html' },
                'search_bar@search': {
                    templateUrl: '/js/app/sss/search/search_bar_partial.html' },
                'top_hits@search': {
                    templateUrl: '/js/app/sss/search/top_hits_partial.html' }
            }
        })
    }
}());

