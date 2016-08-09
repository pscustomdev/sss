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
        // Rating
        //$scope.rate = 5;
        //$scope.max = 5;
        //$scope.isReadonly = true;
        //$scope.hoveringOver = function(value) {
        //    $scope.overStar = value;
        //    $scope.percent = 100 * (value / $scope.max);
        //};
        //$nodeServices.addSnippet({_id: uuid, displayName: $scope.formData.displayName, description: $scope.formData.description, owner: $rootScope.currentUser.username, readme: $scope.formData.readme}).then(
        //    function () {
        //        $state.go('search.results.overview', { snippetId: uuid});
        //    }
        //);
        //$scope.blah = function() {
            $nodeServices.getSnippetsByOwner($rootScope.currentUser.username).then(
                function (data) {
                    console.log("blah");
                    $scope.mySnippets = data;
                }
            );
        //}
    }

    //function showMoreDirective() {
    //    return function() {
    //        $('.show-more').showMore({
    //            adjustHeight: 40,
    //            moreText: "+ More",
    //            lessText: "- Less"
    //        });
    //    };
    //}
}());