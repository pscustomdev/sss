(function() {
    'use strict';
    
    angular.module('app.$nodeServices', [])
        .factory('$nodeServices', apiFactory);

    apiFactory.$inject = ['$http', '$log'];

    function apiFactory($http, $log) {
        return {
            getCurrentUser: getCurrentUser,
            getSnippets: getSnippets,
            getSnippetsByOwner: getSnippetsByOwner,
            getSnippetOverview: getSnippetOverview,
            getSnippetRating: getSnippetRating,
            getSnippetsRatingsByArray: getSnippetsRatingsByArray,
            getSnippetRatingByUser: getSnippetRatingByUser,
            searchCode: searchCode,
            getCommits: getCommits,
            addSnippet: addSnippet,
            addUpdateSnippetRating: addUpdateSnippetRating,
            updateSnippet: updateSnippet,
            markSnippet: markSnippet,
            deleteSnippet: deleteSnippet,
            getFile: getFile,
            addFile: addFile,
            updateFile: updateFile,
            markFile: markFile,
            deleteFile: deleteFile,
            runDBIndexer: runDBIndexer,
            runFileIndexer: runFileIndexer
        };

        //Make sure to add the function into the return statement.

        function getCurrentUser() {
            return $http.get("/api/authenticated-user")
                .then(function (response) {
                        return response.data;
                    },
                    function (reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function (err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // list all snippets
        function getSnippets() {
            return $http.get('/api/snippets')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // get all snippets by owner
        function getSnippetsByOwner(owner) {
            return $http.get('/api/snippets?owner=' + owner)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // get information about a snippet
        function getSnippet() {
            return $http.get('/api/snippet')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function addSnippet(snippet) {
            return $http.post('/api/snippet', snippet)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function updateSnippet(snippet) {
            return $http.put('/api/snippet/' + snippet._id, snippet)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // mark snippet for deletion
        function markSnippet(snippetId, files) {
            // mark all files in the snippet as deleted
            _.each(files, function(file) {
                markFile(snippetId, file.name);
            });
            return $http.put('/api/snippet/' + snippetId, {_id:snippetId, deleted:"true"})
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function deleteSnippet(snippetId) {
            return $http.delete('/api/snippet/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }


        // cleanup (delete) all marked snippets and files
        function cleanupMarkedSnippetsFiles() {
            return $http.delete('/api/cleanup-marked-snippets-files')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }


        // get overview information about a snippet
        function getSnippetOverview(snippetId) {
            return $http.get('/api/snippet-overview/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // get a file from a snippet
        function getFile(snippetId, fileName) {
            return $http.get('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
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
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
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
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // mark a file for deletion in a snippet
        function markFile(snippetId, fileName) {
            var data = {};
            data.content = "deleted=true";
            return $http.put('/api/snippet-detail/' + snippetId + "/" + fileName, data)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // delete a file from a snippet
        function deleteFile(snippetId, fileName) {
            return $http.delete('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function searchCode(searchTerms) {
            return $http.get('/api/snippet-search?q=' + encodeURIComponent(searchTerms))
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });    
        }

        function getCommits(repoOwner, repoName) {
            return $http.get('/api/snippet-search/' + repoOwner + "/" + repoName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        //get rating for one snippet
        function getSnippetRating(snippetId) {
            return $http.get('/api/rating/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        //Returns an array of snippets with their ratings
        function getSnippetsRatingsByArray(snippets) {
            //snippets should be a list split by ,
            return $http.get('/api/ratings/' + snippets)
                .then(function(responses) {
                        return responses;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function getSnippetRatingByUser(userRating) {
            return $http.get('/api/rating/' + userRating.snippetId + '/' + userRating.user)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // add a rating for a snippet
        function addUpdateSnippetRating(rating) {
            return $http.post('/api/rating/' + rating.snippetId, rating)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // run azure db indexer
        function runDBIndexer() {
            return $http.get('/api/indexer/db')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // run azure file indexer
        function runFileIndexer() {
            return $http.get('/api/indexer/file')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }
    }
}());