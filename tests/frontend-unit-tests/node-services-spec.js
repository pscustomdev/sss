'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'node-services-spec') ****");

describe('SSS Node Services', function() {
    beforeEach(module('app.$nodeServices'));

    var $httpBackend, $nodeServices;

    beforeEach(inject(function ($injector) {
        $nodeServices = $injector.get('$nodeServices');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error
    }));

    afterEach(function() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('getSnippets() should call api/snippets GET', function() {
        $httpBackend.expectGET('/api/snippets').respond();
        $nodeServices.getSnippets();
    });

    it('getSnippetOverview() should call api/snippet-overview GET', function() {
        var mockSnippetId = 'mockSnippetId';
        $httpBackend.expectGET('/api/snippet-overview/' + mockSnippetId).respond();
        $nodeServices.getSnippetOverview(mockSnippetId);
    });

    it('getSnippetDetail() should call api/snippet-detail GET', function() {
        var mockSnippetFilename = 'mockFilename';
        var mockSnippetId = 'mockSnippetId';
        $httpBackend.expectGET('/api/snippet-detail/' + mockSnippetId + "/" + mockSnippetFilename).respond();
        $nodeServices.getFile(mockSnippetId, mockSnippetFilename);
    });

    it('searchCode() should call api/snippet-search?q=searchterms GET', function() {
        var mockSnippetSearchTerms = "mock search terms";
        var mockPayload = [mockSnippetSearchTerms];
        $httpBackend.expectGET('/api/snippet-search?q=' + mockSnippetSearchTerms).respond();
        $nodeServices.searchCode(mockSnippetSearchTerms);
    });

    it('getCurrentUser() should call api/authenticated-user GET', function() {
        $httpBackend.expectGET('/api/authenticated-user').respond();
        $nodeServices.getCurrentUser();
    });

    it('getSnippetsByOwner() should call api/snippets/:owner GET', function() {
        var owner = "owner";
        $httpBackend.expectGET('/api/snippets/' + owner).respond();
        $nodeServices.getSnippetsByOwner(owner);
    });

    it('addSnippet() should call api/snippet POST', function() {
        var mockPayload = "snippet";

        $httpBackend.expectPOST('/api/snippet', mockPayload, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();

        $nodeServices.addSnippet(mockPayload);
    });

    it('updateSnippet() should call api/snippet PUT', function() {
        var mockPayload = "snippet";

        $httpBackend.expectPUT('/api/snippet', mockPayload, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();

        $nodeServices.updateSnippet(mockPayload);
    });

    it('deleteSnippet()should call api/snippet/:snippetId DELETE', function() {
        var snippetId = "123"
        $httpBackend.expectDELETE('/api/snippet/' + snippetId).respond();
        $nodeServices.deleteSnippet(snippetId);
    });

    xit('getFile() should PUT data then have a response', function() {

    });

    xit('addFile() should PUT data then have a response', function() {

    });

    xit('updateFile() should PUT data then have a response', function() {

    });

    xit('deleteFile() should PUT data then have a response', function() {

    });
});