(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$nodeServices', '$stateParams'];

    function StateProvider($stateProvider) {
        $stateProvider.state('details', {
            url: '/snippet-detail/:snippetId/:fileName',
            views: {
                '': { templateUrl: '/js/app/sss/details/view.html', controller: 'DetailsController' },
                'details@details': {
                    templateUrl: '/js/app/sss/details/details_partial.html' }
            }
        });
    }

    function DetailsController($nodeServices, $stateParams) {
        var vm = this;
        vm.snippetId = $stateParams.snippetId;
        vm.fileName = $stateParams.fileName;

        $nodeServices.getSnippetDetail(vm.snippetId, vm.fileName).then (
            function(data) {
                vm.snippetDetail = data;
            }
        );
    }
}());