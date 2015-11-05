(function() {
    'use strict';
    
    angular.module('app.$nodeServices', [])
        .factory('$nodeServices', apiFactory);

    apiFactory.$inject = ['$http','$log'];

    function apiFactory($http, $log) {
        return {
            getSnippets: getSnippets,
            getSnippetOverview: getSnippetOverview,
            getSnippetDetail: getSnippetDetail,
            searchCode: searchCode,
            getCommits: getCommits
        };
        
        //Make sure to add the function into the return statement.
        function getSnippets() {
            return $http.get('/api/snippets')
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    $log.debug(reason);
                })
                .catch(function(err) {
                    $log.debug(err);
                });
        }

        function getSnippetOverview(snippetId) {
            return $http.get('/api/snippet-overview/' + snippetId)
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    $log.debug(reason);
                })
                .catch(function(err) {
                    $log.debug(err);
                });
        }

        function getSnippetDetail(snippetId, fileName) {
            return $http.get('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                    return response.data;
                },
                function(reason) {
                    $log.debug(reason);
                })
                .catch(function(err) {
                    $log.debug(err);
                });
        }
       
        function searchCode(searchTerms) {
            return $http.get('/api/snippet-search?q=' + searchTerms)
                .then(function(response) {
                    $log.debug("response: " + JSON.stringify(response.data));
                    return response.data;
                },
                function(reason) {
                    $log.debug(reason);
                })
                .catch(function(err) {
                    $log.debug(err);
                });    
        }

        function getCommits(repoOwner, repoName) {
            return $http.get('/api/snippet-search/' + repoOwner + "/" + repoName)
                .then(function(response) {
                    $log.debug("response: " + JSON.stringify(response.data));
                    return response.data;
                },
                function(reason) {
                    $log.debug(reason);
                })
                .catch(function(err) {
                    $log.debug(err);
                });
        }
    }
}());