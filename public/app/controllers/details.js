(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$scope', '$nodeServices', '$stateParams', '$state'];

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

    function DetailsController($scope, $nodeServices, $stateParams, $state) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;
        $scope.isOwner = $stateParams.isOwner;
        $scope.isMarkdown = false;
        $scope.showEditor = false;
        $scope.confirmCancel = false;
        $scope.content = "";
        $scope.origContent = "";
        $scope.formattedReadme = "";
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

            // autodetect file type by extension
            var fileComps = ($scope.fileName ? $scope.fileName.toLowerCase().split(".") : ['txt']);
            var mode = fileComps[fileComps.length - 1];
            switch (mode) {
                case 'xsl': mode = 'xml'; break;
                case 'md': mode = 'markdown'; $scope.isMarkdown = true; break;
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

        // format the marked down readme to html for preview
        $scope.formatReadme = function() {
            $scope.formattedReadme = formatReadme($scope.content);
        }

    }
}());