(function() {
    'use strict';
    angular.module('app.login', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('LoginController', LoginController);

    StateProvider.$inject = ['$stateProvider'];
    LoginController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('login', {
            url: '/login',
            data: {
                displayName: 'Login'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/login.html', controller: 'LoginController'}
            }
        })
    }


    function LoginController($scope, $rootScope, $state, $nodeServices) {
    }
}());