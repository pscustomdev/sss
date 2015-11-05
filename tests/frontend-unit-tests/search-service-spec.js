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
        var mockPayload, mockSnippetSearchTerms;

        beforeEach(function() {
            mockSnippetSearchTerms = "mock search terms";
            mockPayload = [mockSnippetSearchTerms];
            $httpBackend.expectGET(/\/api\/snippet-search\?.*/).respond(mockPayload);
            $httpBackend.expectGET(/\/api\/snippet-search\/\w+.*\/\w+.*/).respond(mockPayload);
        });

        beforeEach(function() {
            $searchService.submitSearch(mockSnippetSearchTerms);
            $httpBackend.flush();
        });

        it('should return data as passed in via mock', function() {
            expect($searchService.searchResults).to.deep.equal(mockPayload);
        });

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });
});