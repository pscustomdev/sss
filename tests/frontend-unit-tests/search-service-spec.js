'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'search-service-spec') ****");

describe('SSS Search Service', function() {
    beforeEach(module('app.$searchService'));

    var $httpBackend, $searchService;

    beforeEach(inject(function ($injector) {
        $searchService = $injector.get('$searchService');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error
    }));

    describe('clearSearch()', function(){
        var mockSearchTerms;

        beforeEach(function() {
            mockSearchTerms = "testing idm";
            $searchService.searchTerms = mockSearchTerms;
            $searchService.clearSearch();
        });

        it('should clear out existing search terms', function() {
            expect($searchService.searchTerms).to.be.empty;
        });
    });

    describe('submitSearch()', function(){
        var testData = readJSON('tests/frontend-unit-tests/test-data.json');
        var mockSnippetResponse, mockRatingsResponse, mockSnippetSearchTerms;

        beforeEach(function() {
            mockSnippetSearchTerms = testData.submitSearch.request.query_parameters[0];
            mockSnippetResponse = testData.submitSearch.response;
            mockRatingsResponse = testData.ratingsResponse;

            $httpBackend.whenGET('api/snippet' + /.*/).respond(mockSnippetResponse);
            $httpBackend.expectGET('/api/snippet-search?q=XSLT taco').respond(mockSnippetResponse);
            $httpBackend.expectGET('/api/ratings/ImCooler,Strip-CN-from-DN').respond(mockRatingsResponse);
            //$httpBackend.expectGET(/\/api\/snippet-search\/\w+.*\/\w+.*/).respond(mockResponse);
        });

        beforeEach(function() {
            $searchService.submitSearch(mockSnippetSearchTerms);
            $httpBackend.flush();
        });

        it('should return a response that includes a "highlit_fragment" attribute', function() {
            ($searchService.searchResults.items[0].text_matches[0].matches[0]).should.have.property('highlit_fragment');
        });

        it('should return a response that includes a rating', function() {
            ($searchService.searchResults.items[0].rating).should.equal(mockRatingsResponse[0].rating);
        });

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });
});