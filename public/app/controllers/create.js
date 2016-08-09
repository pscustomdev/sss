(function() {
    'use strict';

    angular.module('app.create', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
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
        $scope.formData = {};

        $scope.createSnippet = function() {
            var uuid = generateUUID();

            $nodeServices.addSnippet({_id: uuid, displayName: $scope.formData.displayName, description: $scope.formData.description, owner: $rootScope.currentUser.username, readme: $scope.formData.readme}).then(
                function () {
                    $state.go('search.results.overview', { snippetId: uuid});
                }
            );
        };

        $scope.cancelCreate = function() {
            $state.go('search', {});
        }

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            _session.setMode('ace/mode/markdown');
            _session.setUndoManager(new ace.UndoManager());

            // height adjusted dynamically in util.js
            $(window).resize();
        };
    }
}());
