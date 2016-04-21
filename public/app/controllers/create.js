(function() {
    'use strict';

    angular.module('app.create', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('CreateController', CreateController);

    StateProvider.$inject = ['$stateProvider'];
    CreateController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices'];

    function StateProvider($stateProvider) {
        $stateProvider.state('search.create', {
            url: '/create',
            data: {
                displayName: 'Create'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/create.html', controller: 'CreateController'
                }
            }
        });
    }

    function CreateController($scope, $rootScope, $state, $nodeServices) {
        $scope.createSnippet = function() {
            var uuid = generateUUID();

            $nodeServices.addModifySnippet({_id: uuid, displayName: $scope.formData.displayName, description: $scope.formData.description, owner: $rootScope.currentUser.username, readme: $scope.formData.readme}).then(
                function () {
                    //ToDo: This occurs too soon before the readme is fully created so the githup API returns a 500.
                    //      we could delay before we go to this state or come up with some other mechanism
                    //      to go to this state once the readme is ready
                    $state.go('search.results.overview', { snippetId: uuid});
                }
            );

            //ToDo: Add edit controls to details page, displayed when the current user is the owner

        };

        $scope.formData = {};
    }
}());
