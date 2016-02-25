'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'overview-view-spec') ****");

describe('SSS Views', function() {
    describe('Overview-View', function(){
        beforeEach(module('app.overview'));

        var $scope, $nodeServices, $stateParams, $httpBackend, $controller;

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();  // Create a new child scope or $rootScope
            $nodeServices = $injector.get('$nodeServices');
            $stateParams = $injector.get('$stateParams');
            $httpBackend = $injector.get('$httpBackend');
        }));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('OverviewContoller', function(){
            var controller, mockPayload;

            beforeEach(function() {
                mockPayload = [{"name": "README.md"}];
                controller = $controller('OverviewController', { $scope: $scope, $nodeServices: $nodeServices, $stateParams: $stateParams});
                $httpBackend.expectGET(/\/api\/snippet-overview\/\w+.*/).respond(200, mockPayload);
                $httpBackend.flush();
            });

            it('should be defined', function() {
                expect(controller).to.not.be.undefined;
            });

        });
    });
});