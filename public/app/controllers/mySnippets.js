(function() {
    'use strict';
    angular.module('app.mySnippets', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices','app.$searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('MySnippetsController', MySnippetsController);

    StateProvider.$inject = ['$stateProvider'];
    MySnippetsController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices', '$searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.mySnippets', {
            url: '/mySnippets',
            data: {
                displayName: 'My Snippets'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/results.html', controller: 'MySnippetsController'}
            }
        })
    }

    function MySnippetsController($scope, $rootScope, $state, $nodeServices, $searchService) {
        //if they aren't logged in then send them to the login page.
        $nodeServices.getCurrentUser().then(
            function (user) {
                if(!user) {
                    $state.go('login');
                }
            }
        );

        $rootScope.$watch('currentUser', function(user) {
            if (user) {
                $searchService.submitSearch($rootScope.currentUser.username);
            }
        });
    }
}());