(function() {
    'use strict';
    
    angular
        .module('app')
        .controller('DetailController', DetailController);
        
    DetailController.$inject = ['angularService','$routeParams'];
        
    function DetailController(angularService, $routeParams) {
        var vm = this;
        vm.snippetId = $routeParams.snippetId;
        vm.fileName = $routeParams.fileName;

        angularService.getSnippetDetail($routeParams.snippetId, $routeParams.fileName)
            .then(function(data) {
                vm.snippetDetail = data;    
            });
    }
    
}());