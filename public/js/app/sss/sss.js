(function() {
    'use strict';

    angular
        .module('app')
        .controller('SSSController', SSSController)
        .controller('SearchController', SearchController)
        .factory('SearchService', SearchService);

    SSSController.$inject = ['$scope', 'SearchService', 'angularService'];    
    SearchController.$inject = ['$scope', 'SearchService', '$http', '$location'];    
    SearchService.$inject = ['$location', '$http', 'angularService'];    
        
    function SSSController($scope, SearchService, angularService) {
        var vm = this;
        vm.firstName = "FIRST NAME GOES HERE";
  
        // Create a reference to the SearchService and add it to the 
        // $scope so it will be available on the page
        $scope.searchService = SearchService;
    }
    
    function SearchController($scope, SearchService, $http, $location) {
        // Your search input
        $scope.searchTerms = "";
    }
    
    function SearchService($location, $http, angularService) {
        var searchService = {};
        
        // The array that will contain search results
        searchService.arrSearchResults = [];
        
        // The search term (for decoration)
        SearchService.searchTerm = "";
        
        // Control if user searched recently
        SearchService.userSearched = false;
        
        // Control the state of the search
        SearchService.typeOfSearch = "web";
        
        // Switch the search type/state
        SearchService.switchSearchType = function(aSearchType) {
          SearchService.typeOfSearch = aSearchType;
          
          // Check if user has a search term, if true then rerun search
          if (SearchService.searchTerm !== "") {
            console.log("rerunning search!");
            SearchService.arrSearchResults = [];
            SearchService.submitSearch(SearchService.searchTerm);
          }
        };
        
        // Clear the search
        searchService.clearSearch = function() {
          SearchService.searchTerm = "";
          searchService.arrSearchResults = [];
          SearchService.userSearched = false;
        };
        
        // Search function
        searchService.submitSearch = function(aSearchTerm) {
            //angularService is defined in the angular-service.js file
            angularService.searchCode(aSearchTerm).then(function(data){
                searchService.arrSearchResults = data;    
            });  
//          }
        }
        
        return searchService;
    }
}());