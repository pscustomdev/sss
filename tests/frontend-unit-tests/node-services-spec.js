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

    //This test works locally but does not work on Jenkins for some reason.  I have no idea why so I'm disabling it for now.
    xit('updateSnippet() should call api/snippet/:snippetId PUT', function() {
        var snippet = {snippet:"snippet",_id:"abc"};

        $httpBackend.expectPUT('/api/snippet/' + snippet._id, snippet, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();

        $nodeServices.updateSnippet(snippet);
    });

    it('deleteSnippet()should call api/snippet/:snippetId DELETE', function() {
        var snippetId = "123"
        $httpBackend.expectDELETE('/api/snippet/' + snippetId).respond();
        $nodeServices.deleteSnippet(snippetId);
    });

    it('getFile() should call /api/snippet-detail/:snippetId/:fileName GET', function() {
        var snippetId = "mockSnippetId";
        var fileName = "mockFilename";
        $httpBackend.expectGET('/api/snippet-detail/' + snippetId + "/" + fileName).respond();
        $nodeServices.getFile(snippetId, fileName);
    });

    it('addFile() should call /api/snippet-detail/:snippetId/:fileName POST', function() {
        var snippetId = "mockSnippetId";
        var fileName = "mockFilename";
        var fileContent = "This is file content";
        $httpBackend.expectPOST('/api/snippet-detail/' + snippetId + "/" + fileName, {"content":"This is file content"}, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();
        $nodeServices.addFile(snippetId, fileName, fileContent);
    });

    it('updateFile() should call /api/snippet-detail/:snippetId/:fileName PUT', function() {
        var snippetId = "mockSnippetId";
        var fileName = "mockFilename";
        var fileContent = "This is file content";
        $httpBackend.expectPUT('/api/snippet-detail/' + snippetId + "/" + fileName, {"content":"This is file content"}, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();
        $nodeServices.updateFile(snippetId, fileName, fileContent);
    });

    it('deleteFile() should call /api/snippet-detail/:snippetId/:fileName DELETE', function() {
        var snippetId = "mockSnippetId";
        var fileName = "mockFilename";
        $httpBackend.expectDELETE('/api/snippet-detail/' + snippetId + "/" + fileName).respond();
        $nodeServices.deleteFile(snippetId, fileName);
    });

    it('formatReadme() should call /api/snippet-detail/:snippetId/readme/format PUT', function() {
        var snippetId = "mockSnippetId";
        var content = "This is readme content";
        $httpBackend.expectPUT('/api/snippet-detail/' + snippetId + "/readme/format", content, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();
        $nodeServices.formatReadme(snippetId, content);
    });

    it('getSnippetRating() should call api/rating/:snippetId GET', function() {
        var snippetId = "MochaTestRepo";
        $httpBackend.expectGET('/api/rating/' + snippetId).respond();
        $nodeServices.getSnippetRating(snippetId);
    });

    it('getSnippetsRatings() should call api/ratings/listOfSnippetIds GET', function() {
        var ids = "id1,id2,id3";
        $httpBackend.expectGET('/api/ratings/' + ids).respond();
        $nodeServices.getSnippetsRatingsByArray(ids);
    });

    it('getSnippetRatingByUser() should call api/rating/:snippetId GET', function() {
        var userRating = {snippetId:"fakeSnippetId", user:"fakeUser"};
        $httpBackend.expectGET('/api/rating/' + userRating.snippetId + '/' + userRating.user).respond();
        $nodeServices.getSnippetRatingByUser(userRating);
    });

    it('addRating() should call api/rating/:snippetId POST', function() {
        var rating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:5};

        $httpBackend.expectPOST('/api/rating/' + rating.snippetId, rating, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();

        $nodeServices.addUpdateSnippetRating(rating);
    });

    it('updateRating() should call api/rating/:snippetId PUT', function() {
        var rating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:5};

        $httpBackend.expectPOST('/api/rating/' + rating.snippetId, rating, function(headers) {
            return headers['Accept'] === 'application/json, text/plain, */*';
        }).respond();

        $nodeServices.addUpdateSnippetRating(rating);
    });

});