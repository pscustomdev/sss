'use strict';


describe('Get snippets', function(){
    var $httpBackend, api;

    beforeEach(module('app'));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        api = $injector.get('api');
        
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should return at least one snippet', inject(function($controller) {
        $httpBackend.when('GET', '/api/snippets')
            .respond(200, {
               blah: "taco" 
            });
    
            api.getSnippets().then(function(response){
                expect(response).toEqual({blah : "taco"}); 
            });
        $httpBackend.flush();    
    })); 
});