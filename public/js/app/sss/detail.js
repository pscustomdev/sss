(function() {
    'use strict';
    
    angular
        .module('app')
        .controller('DetailController', DetailController);
        
    DetailController.$inject = ['api','$routeParams'];    
        
    function DetailController(api, $routeParams) {
        var vm = this;
        vm.snippetId = $routeParams.snippetId;
        vm.fileName = $routeParams.fileName;
        
        api.getSnippetDetail($routeParams.snippetId, $routeParams.fileName)
            .then(function(data) {
                vm.snippetDetail = data;    
            });
    }
}());