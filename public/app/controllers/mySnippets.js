(function() {
    'use strict';
    angular.module('app.mySnippets', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('MySnippetsController', MySnippetsController);

    StateProvider.$inject = ['$stateProvider'];
    MySnippetsController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('mySnippets', {
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
        $scope.noSnippet = "No Snippets Found";
        $nodeServices.getSnippetsByOwner($rootScope.currentUser.username).then(
            function (data) {
                if(data){
                    $scope.mySnippets = data;
                    $scope.noSnippet = "";
                } else {
                    $state.go('login', {});
                }
            }

        );
    }
}());