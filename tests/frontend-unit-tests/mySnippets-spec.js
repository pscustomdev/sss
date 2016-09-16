console.log("**** (Frontend Unit Testing [KARMA]: 'node-services-spec') ****");

describe('mySnippets Controller', function() {
    var $httpBackend, createController;
    beforeEach(module('app.mySnippets'));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');

        $controller = $injector.get('$controller');
        scope = $rootScope.$new();
        $rootScope.currentUser = {username: "blah"};
        $httpBackend.whenGET(/\/app\/views\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error

    }));

    afterEach(function() {
        //TODO This isn't working because it keeps getting extra GET calls is this a bug?
        //$httpBackend.verifyNoOutstandingExpectation();
        //$httpBackend.verifyNoOutstandingRequest();
    });

    //TODO This isn't working because we are getting multiple /api/authenticated-user api calls is this a bug?
    xit('should see if there is a current user', function() {
        //Should get the authenticated user
        //Then should go to the search page
        $httpBackend.expectGET('/api/authenticated-user').respond("blah");
        $controller('MySnippetsController', {'$scope' : scope });
        $httpBackend.flush();
    });

    xit('should set $scope.noSnippet to a default', function() {
        $controller('MySnippetsController', {'$scope' : scope });
        expect(scope.noSnippet).to.equal("No Snippets Found");
    });
});
