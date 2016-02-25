'use strict';
console.log("**** (End-To-End GUI Testing [PROTRACTOR]: 'details-page-spec') ****");

var db = require('../../db/mongo-dao');

describe('Details', function() {
    //browser.driver.get('http://localhost:3000/users/create');
    //browser.driver.get('https://sss-pscustomdev.c9.io/users/create');
    //var vm = {
    //    firstName: "fname",
    //    lastName: "lname",
    //    email:"fake@email.com",
    //    password: "pwd"
    //};
    //
    //beforeEach(function(done) {
    //    //cleanup fake user
    //    db.removeUser(vm, function (err, data) {
    //        if (err) console.log(err);
    //        done();
    //    });
    //
    //}, 5000);
    //
    //afterEach(function(done) {
    //    //cleanup fake user
    //    db.removeUser(vm, function (err, data) {
    //        if (err) console.log(err);
    //        done();
    //    });
    //
    //}, 5000);
    //
    //it('create a user and land on the Main page', function (done) {
    //    browser.driver.findElement(by.id('createUserBtn')).click();
    //
    //    //Create a user using browser.driver
    //    browser.driver.findElement(by.id('firstName')).sendKeys(vm.firstName);
    //    browser.driver.findElement(by.id('lastName')).sendKeys(vm.lastName);
    //    browser.driver.findElement(by.id('email')).sendKeys(vm.email);
    //    browser.driver.findElement(by.id('password')).sendKeys(vm.password);
    //    browser.driver.findElement(by.id('createAccountBtn')).click().then(function() {
    //        //check that the user was created in the database.
    //        var obj = {
    //            email: vm.email
    //        };
    //        db.findUsers(obj, function (err, users){
    //            expect(users).toBeTruthy();
    //            expect(users[0].firstName).toEqual(vm.firstName);
    //            expect(users[0].lastName).toEqual(vm.lastName);
    //            expect(users[0].email).toEqual(vm.email);
    //            done();
    //        });
    //        browser.driver.findElement(by.id('logoutBtn')).click();
    //    });
    //});
});