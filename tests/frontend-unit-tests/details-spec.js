console.log("**** (Frontend Unit Testing [KARMA]: 'details-view-spec') ****");

describe('SSS Views', function() {
    describe('Details-Controller', function() {
        beforeEach(module('app.details'));
        beforeEach(module('angular-growl'));

        var $scope, $nodeServices, $stateParams, $httpBackend, $controller;

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();  // Create a new child scope or $rootScope
            $nodeServices = $injector.get('$nodeServices');
            $stateParams = $injector.get('$stateParams');
            $httpBackend = $injector.get('$httpBackend');
            $controller = $injector.get('$controller');

            $stateParams.snippetId = "fakeSnippetId";
            $stateParams.fileName = "fakeFileName";
            $stateParams.isOwner = true;

            var mockPayload = "http://blah";
            //$httpBackend.whenGET('/api/snippet-detail/fakeSnippetId/fakeFileName').respond(200, mockPayload);

            createController = function() {
                return $controller('DetailsController', {
                    $scope: $scope,
                    $nodeServices: $nodeServices,
                    $stateParams: $stateParams
                });
            };
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should be defined', function() {
            var mockPayload = "http://blah";
            $httpBackend.expectGET('/api/snippet-detail/fakeSnippetId/fakeFileName').respond(200, mockPayload);
            var controller = createController();
            $httpBackend.flush();
            expect($controller).to.not.be.undefined;
        });

        it('should set some scope variables to defaults', function() {
            var controller = createController();
            var mockPayload = "http://blah";
            $httpBackend.expectGET('/api/snippet-detail/fakeSnippetId/fakeFileName').respond(200, mockPayload);
            expect($scope.snippetId).to.equal($stateParams.snippetId);
            expect($scope.fileName).to.equal($stateParams.fileName);
            expect($scope.isOwner).to.equal($stateParams.isOwner);
            expect($scope.content).to.equal("");
            $httpBackend.flush();
        });

        it('should get a file by calling /api/snippet-detail/filename GET', function() {
            var controller = createController();
            var mockPayload = "http://blah";
            $httpBackend.expectGET('/api/snippet-detail/fakeSnippetId/fakeFileName').respond(200, mockPayload);
            //expect($scope.content).to.equal("");
            //expect($scope.contentUrl).to.equal("asdf");

            $httpBackend.flush();
        });

        xit('should save a file by calling /api/snippet-detail/snippetId/fileName PUT', function() {
            var controller = createController();
            //var mockPayload = "http://blah";
            $httpBackend.expectPUT('/api/snippet-detail/fakeSnippetId/fakeFileName').respond(200, mockPayload);
            //expect($scope.content).to.equal("");
            //expect($scope.contentUrl).to.equal("asdf");

            $httpBackend.flush();
        });
    });
});