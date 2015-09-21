// Helper utility to handle ui-router state transitions better
angular.module('stateMock',[]);
angular.module('stateMock').service("$state", function($q) {
    this.expectedTransitions = [];
    this.current = {};
    this.transitionTo = function(stateName, params) {
        if (this.expectedTransitions.length > 0) {
            var expectedState = this.expectedTransitions.shift();
            if (expectedState !== stateName){
                throw Error("Expected transition to state: " + expectedState + " but transitioned to " + stateName);
            }
            if(!angular.equals(expectedState.params, params)){
                throw Error('Expected params to be ' + JSON.stringify(expectedState.params) + ' but received ' + JSON.stringify(params));
            }
        } else {
            throw Error("No more transitions were expected! Tried to transition to "+ stateName);
        }
        console.log("Mock transition to: " + stateName);
        this.current.name = stateName;
        return $q.when();
    };
    this.go = this.transitionTo;
    this.expectTransitionTo = function(stateName, params) {
        this.expectedTransitions.push({stateName: stateName, params: params});
    };

    this.ensureAllTransitionsHappened = function() {
        if (this.expectedTransitions.length > 0) {
            throw Error("Not all transitions happened!");
        }
    }
});