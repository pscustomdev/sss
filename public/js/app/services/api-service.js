(function() {
    'use strict';
    
    angular
        .module('app')
        .factory('api', apiFactory);
        
    apiFactory.$inject = ['$http'];
    
    function apiFactory($http) {
        return {
            getSnippets : getSnippets,
            getSnippetOverview : getSnippetOverview,
            getSnippetDetail: getSnippetDetail
        };
        
        //Make sure to add the function into the return statement.
        function getSnippets() {
            return $http.get('/api/snippets')
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    console.log(reason);
                })
                .catch(function(err) {
                    console.log(err);    
                });
        }

        function getSnippetOverview(snippetId) {
            return $http.get('/api/snippet-overview/' + snippetId)
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    console.log(reason);
                })
                .catch(function(err) {
                    console.log(err);    
                });
       }

        function getSnippetDetail(snippetId, fileName) {
            return $http.get('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    console.log(reason);
                })
                .catch(function(err) {
                    console.log(err);    
                });
       }

    }
}());