(function() {
    'use strict';
    angular.module('app.mySnippets', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('MySnippetsController', MySnippetsController);

    StateProvider.$inject = ['$stateProvider'];
    MySnippetsController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.mySnippets', {
            url: '/mySnippets',
            data: {
                displayName: 'My Snippets'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/mySnippets.html', controller: 'MySnippetsController'}
            }
        })
    }


    function MySnippetsController($scope, $rootScope, $state, $nodeServices) {

        //if they aren't logged in then send them to the login page.
        $nodeServices.getCurrentUser().then(
            function (user) {
                if(!user) {
                    $state.go('login');
                }
            }
        );

        $scope.searchInProgress = true;
        $scope.noResultsFound = false;
        $rootScope.$watch('currentUser', function(user) {
            if (user) {
                $nodeServices.getSnippetsByOwner($rootScope.currentUser.username).then(
                    function (data) {
                        $scope.searchInProgress = false;
                        if (data) {
                            $scope.mySnippets = data;
                        } else {
                            $scope.noResultsFound = true;
                        }
                    }
                );
            }
        });
    }
}());