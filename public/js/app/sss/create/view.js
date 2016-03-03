(function() {
    'use strict';
    angular.module('app.create', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('CreateController', CreateController);

    StateProvider.$inject = ['$stateProvider'];
    CreateController.$inject = ['$scope', '$nodeServices', '$stateParams'];

    function StateProvider($stateProvider) {
        $stateProvider.state('create', {
            url: '/create',
            data: {
                displayName: 'Create'
            },
            views: {
                '@': {
                    templateUrl: '/js/app/sss/create/view.html', controller: 'CreateController'
                },
                'contents@create': {
                    templateUrl: '/js/app/sss/create/create_partial.html'
                }
            }
        });
    }

    function CreateController($scope, $nodeServices, $stateParams) {
        $scope.formData = {};

        $scope.createSnippet = function() {
            alert ("TODO CreateSnippet: " + $scope.formData.name);




            //TODO redirect to the edit page
        }


    }

}());
