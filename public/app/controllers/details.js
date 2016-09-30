(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$scope', '$nodeServices', '$stateParams', '$state', 'growl'];

    function StateProvider($stateProvider) {
        $stateProvider.state('search.results.overview.details', {
            url: '/snippet-detail/:snippetId/:fileName',
            data: {
                displayName: '{{$stateParams.fileName}}'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/details.html', controller: 'DetailsController'
                }
            },
            params: {
                isOwner: null
            }
        });
    }

    function DetailsController($scope, $nodeServices, $stateParams, $state, growl) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;
        $scope.isOwner = $stateParams.isOwner;
        $scope.showEditor = false;
        $scope.confirmCancel = false;
        $scope.content = "";
        $scope.origContent = "";
        var indexMessage = "It may take up to 15 minutes for your changes to be searchable.";

        var overviewPage = "search.results.overview";

        $nodeServices.getFile($scope.snippetId, $scope.fileName).then (
            function(data) {
                // if the data starts with http, assume the file contains binary data
                // so it is a URL (see db/github-dao.js)
                if (data.toLowerCase().startsWith("http")) {
                    $scope.contentUrl = data;
                    // otherwise it is raw data
                } else {
                    $scope.content = data;
                    $scope.origContent = data;
                    $scope.showEditor = true;
                }
            }
        );

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            // autodetect file type by extension, if none default to text
            var fileComps = ($scope.fileName ? $scope.fileName.toLowerCase().split(".") : ['text']);
            var mode = fileComps[fileComps.length - 1];
            // if no extension, default to text
            if (fileComps.length == 1) {
                mode = "text";
            }
            switch (mode) {
                case 'xsl': mode = 'xml'; break;
                case 'js': mode = 'javascript'; break;
            }
            _session.setMode('ace/mode/' + mode);
            _session.setUndoManager(new ace.UndoManager());
            _editor.setReadOnly(!$scope.isOwner);

            // height adjusted dynamically in util.js
            $(window).resize();
        };

        $scope.saveFile = function() {
            // if not modified, no need to save
            if ($scope.content == $scope.origContent) {
                $state.go(overviewPage, {});
                return;
            }

            $nodeServices.updateFile($scope.snippetId, $scope.fileName, $scope.content).then (
                function() {
                    $nodeServices.runFileIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                    $state.go(overviewPage, {});
                }
            )
        };

        $scope.cancelEdit = function() {
            // if data has been modified, verify cancel
            if ($scope.content != $scope.origContent) {
                // display modal to confim cancel
                $scope.confirmCancel = false;
                $("#cancelEditModal").modal();
                $("#cancelEditModal").on('hidden.bs.modal', function() {
                    if ($scope.confirmCancel) {
                        $state.go(overviewPage, {});
                        return;
                    }
                });



            } else {
                $state.go(overviewPage, {});
            }
        };

    }
}());