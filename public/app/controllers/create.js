(function() {
    'use strict';

    angular.module('app.create', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('CreateController', CreateController);

    StateProvider.$inject = ['$stateProvider'];
    CreateController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices', 'growl'];

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

    function CreateController($scope, $rootScope, $state, $nodeServices, growl) {
        $scope.formData = {};
        $scope.rawView = true;
        var indexMessage = "It may take up to 5 minutes for your new snippet to be searchable.";

        //if they aren't logged in then send them to the login page.
        $nodeServices.getCurrentUser().then(
            function (user) {
                if(!user) {
                    $state.go('login');
                }
            }
        );

        $scope.createSnippet = function() {
            var uuid = generateUUID();
            var snippet = {
                _id: uuid,
                displayName: $scope.formData.displayName,
                description: $scope.formData.description,
                owner: $rootScope.currentUser.username,
                readme: $scope.formData.readme
            };

            $nodeServices.addSnippet(snippet).then(
                function () {
                    $nodeServices.runDBIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                    $state.go('search.results.overview', { snippetId: uuid});
                }
            );
        };

        $scope.cancelCreate = function() {
            $state.go('search', {});
        };

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            _session.setMode('ace/mode/markdown');
            _session.setUndoManager(new ace.UndoManager());

            // height adjusted dynamically in util.js
            $(window).resize();
        };

        // format the marked down readme to html for preview
        $scope.formatReadme = function() {
            $scope.formData.readme = $scope.formData.readme || "";
            var content = marked($scope.formData.readme);
            $scope.formData.formattedReadme = replaceImageTag(content);
        }
    }
}());
