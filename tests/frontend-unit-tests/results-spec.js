'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'results-view-spec') ****");

describe('SSS Views', function() {
    describe('Results-View', function() {
        beforeEach(module('app.results'));

        var $scope, $controller, resultsController, searchBarFilteringController, searchCriteriaController;

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();  // Create a new child scope or $rootScope
        }));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
            resultsController = $controller('ResultsController', { $scope: $scope});
            searchBarFilteringController = $controller('SearchBarFilteringController', { $scope: $scope});
            searchCriteriaController = $controller('SearchCriteriaController', { $scope: $scope});
        }));

        it('controllers should be defined', function() {
            expect(resultsController).to.not.be.undefined;
            expect(searchBarFilteringController).to.not.be.undefined;
            expect(searchCriteriaController).to.not.be.undefined;
        });

        it('should have default $scope variables defined', function() {
            expect($scope.results_filter).to.not.be.undefined;
            expect($scope.search_criteria).to.be.eql(
                [
                    { displayValue: 'javascript', active: true, count: 0 },
                    { displayValue: 'idm', active: true, count: 35},
                    { displayValue: 'searchterm3', active: true, count: 7 }
                ]
            );
            expect($scope.avgRatingOptions).to.be.eql(
                {
                    ratedFill: '#337ab7',
                    readOnly: true,
                    halfStar: true,
                    starWidth: "20px"
                }
            );
            //expect($scope.fileContent).to.be.eql("");
            //expect($scope.confirmDelete).to.be.eql(false);
            //expect($scope.avgRatingOptions).to.be.eql({
            //    ratedFill: '#337ab7',
            //    readOnly: true,
            //    halfStar: true,
            //    starWidth: "20px"
            //});
        });
    });
});