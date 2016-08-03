(function() {
    'use strict';
    
    angular.module('app.$nodeServices', [])
        .factory('$nodeServices', apiFactory);

    apiFactory.$inject = ['$http', '$log'];

    function apiFactory($http, $log) {
        return {
            getCurrentUser: getCurrentUser,
            getSnippets: getSnippets,
            getSnippetOverview: getSnippetOverview,
            searchCode: searchCode,
            getCommits: getCommits,
            addSnippet: addSnippet,
            updateSnippet: updateSnippet,
            deleteSnippet: deleteSnippet,
            getFile: getFile,
            addFile: addFile,
            updateFile: updateFile,
            deleteFile: deleteFile
        };

        //Make sure to add the function into the return statement.

        function getCurrentUser() {
            return $http.get("/api/authenticated-user")
                .then(function (response) {
                        return response.data;
                    },
                    function (reason) {
                        $log.debug(reason);
                    })
                .catch(function (err) {
                    $log.debug(err);
                });
        }

        // list all snippets
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

        // get information about a snippet
        function getSnippet() {
            return $http.get('/api/snippet')
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

        function addSnippet(snippet) {
            return $http.post('/api/snippet', snippet)
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

        function updateSnippet(snippet) {
            return $http.put('/api/snippet', snippet)
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

        function deleteSnippet(snippetId) {
            return $http.delete('/api/snippet/' + snippetId)
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

        // get overview information about a snippet
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

        // get a file from a snippet
        function getFile(snippetId, fileName) {
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

        // add a file to a snippet
        function addFile(snippetId, fileName, content) {
            var data = {};
            data.content = content;
            return $http.post('/api/snippet-detail/' + snippetId + "/" + fileName, data)
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

        // update a file in a snippet
        function updateFile(snippetId, fileName, content) {
            var data = {};
            data.content = content;
            return $http.put('/api/snippet-detail/' + snippetId + "/" + fileName, data)
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

        // delete a file from a snippet
        function deleteFile(snippetId, fileName) {
            return $http.delete('/api/snippet-detail/' + snippetId + "/" + fileName)
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