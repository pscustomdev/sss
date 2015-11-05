'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'results-view-spec') ****");

describe('SSS Views', function() {
    describe('Results-View', function() {
        beforeEach(module('app.results'));

        var $scope, $controller;

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();  // Create a new child scope or $rootScope
        }));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        describe('ResultsController', function() {
            var controller;

            beforeEach(function() {
                controller = $controller('ResultsController', { $scope: $scope});
            });

            it('should be defined', function() {
                expect(controller).to.not.be.undefined;
            });
        });
    });
});