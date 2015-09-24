(function() {
    'use strict';

    angular.module('app.details', ['ui.router'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', Controller);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['angularService','$stateParams'];

    function StateProvider(stateProvider) {
        stateProvider.state('details', {
            url: '/snippet-detail/:snippetId/:fileName',
            views: {
                '': {
                    controller: 'DetailsController',
                    controllerAs: 'vm',
                    templateUrl: '/js/app/sss/details/view.html'
                }
            }
        });
    }

    function Controller(angularService, stateParams) {
        var vm = this;
        vm.snippetId = stateParams.snippetId;
        vm.fileName = stateParams.fileName;

        angularService.getSnippetDetail(vm.snippetId, vm.fileName).then (
            function(data) {
                vm.snippetDetail = data;
            }
        );
    }
}());