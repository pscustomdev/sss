'use strict';
console.log("**** (End-To-End GUI Testing [PROTRACTOR]: 'index-spec') ****");

var db = require('../../db/mongo-dao');
//*******************NOTES*******************
// browser.driver.whatever is how you use the native web driver when angular is not involved.
// element(by.model('todoList.todoText')).sendKeys('write a protractor test') is how you do it if angular is involved;
// To Try: expect(loginNameInputElm.isPresent()).toBeTruthy();
// TO delay/wait browser.wait(function(){}, 10000, "blah");
//*******************NOTES*******************

//TODO Figure out how to refresh the browser between each describe.
describe('SSS Index Page', function() {
    browser.driver.get('http://localhost:3000');
    //browser.driver.get('https://sss-pscustomdev.c9.io');

    it('should have a title', function () {
        expect(browser.driver.getTitle()).to.equal('Login - SSS');
    });

    it('should have the header', function () {
        expect(browser.driver.findElement(by.tagName('h3')).getText()).toEqual('Super Snippet Search');
    });

    // it('should have a login button', function () {
    //     browser.driver.get('http://localhost:3000');
    //     expect(browser.driver.findElement(by.id('submit-login')).getAttribute('value')).toMatch('Log in');
    // });
});

describe('Login page', function() {
    browser.wait(function(){}, 7000, "blah");
    var vm = {
        firstName: "fname",
        lastName: "lname",
        email:"fake@email.com",
        password: "pwd"
    };
    
    beforeEach(function(done) {
        //cleanup fake user
        db.removeUser(vm, function (err, data) {
            if (err) console.log(err);
            done();
        });

    }, 5000);

    afterEach(function(done) {
        //cleanup fake user
        db.removeUser(vm, function (err, data) {
            if (err) console.log(err);
            done();
        });

    }, 5000);
    
    it('should be able to login a created user.' , function (done) {
        db.addUser(vm, function (err, data) {
            if (err) console.log(err);
            done();
        });
        browser.driver.findElement(by.id('email')).sendKeys(vm.email);
        browser.driver.findElement(by.id('password')).sendKeys(vm.password);
        browser.driver.findElement(by.id('submit-login')).click();
        expect(browser.driver.findElement(by.id('firstName')).getText()).toEqual(vm.firstName);
        browser.driver.findElement(by.id('logoutBtn')).click();
    });
    
    it('should be able to reject when user not exist' , function () {
        //browser.wait(function(){}, 3000, "blah");
        browser.driver.findElement(by.id('email')).sendKeys(vm.email);
        browser.driver.findElement(by.id('password')).sendKeys("blah");
        browser.driver.findElement(by.id('submit-login')).click();
        expect((browser.driver.findElement(by.id('loginError'))).getText()).toEqual("Invalid credentials");
    });
    
    it('should be able to reject an invalid password' , function (done) {
        db.addUser(vm, function (err, data) {
            if (err) console.log(err);
            done();
        });
        browser.driver.findElement(by.id('email')).sendKeys(vm.email);
        browser.driver.findElement(by.id('password')).sendKeys("blah");
        browser.driver.findElement(by.id('submit-login')).click();
        expect(browser.driver.findElement(by.id('loginError')).getText()).toEqual("Invalid credentials");
    });
});
/*
 function createGroup() {
 browser.get('/main');

 element(by.id('createGroupBtn')).click();

 var groupNameElement = element(by.model('vm.groupName'));
 expect(groupNameElement.isPresent()).toBeTruthy();

 var EC = protractor.ExpectedConditions;
 browser.wait(EC.visibilityOf(groupNameElement), 10000, "groupNameElement not present");

 groupNameElement.sendKeys('testGroup');

 element(by.id('createGroupSubmitBtn')).click();
 }
 */

// describe('Main Page', function() {
//     it('should display login info', function () {
//         browser.get('/main');
//         expect(element(by.binding('userName')).getText()).toEqual('Hello Kent!');
//     });

//     it('should create group button and join button', function () {
//         browser.get('/main');

//         element.all(by.css('.btn')).then(function(elements) {
//             var createGroup = elements[0];
//             var joinGroup = elements[1];
//             expect(createGroup.getText()).toEqual("Create Group »");
//             expect(joinGroup.getText()).toEqual("Join Group »");
//         });
//     });

//     it('should open create group modal when create group button is clicked', function () {
//         createGroup();
//         var expectedDiv = element(by.css('.growl-message'));

//         var EC = protractor.ExpectedConditions;
//         browser.wait(EC.presenceOf(expectedDiv), 5000, "No alert present");
//         expect((expectedDiv).getText()).toBe("Welcome! Vote To Eat!");
//     })
//});
//
//
//describe('Open Google Suggestions', function() {
//    it('should have a title and have places to add', function () {
//        createGroup();
//
//        var EC = protractor.ExpectedConditions;
//        var googleSuggestionsBtn = element(by.id('googleSuggestionsBtn'));
//        browser.wait(EC.visibilityOf(googleSuggestionsBtn), 5000, "No googleSuggestionsBtn present");
//        expect(googleSuggestionsBtn.isPresent()).toBeTruthy();
//        googleSuggestionsBtn.click();
//
//        var suggestionTitle = element(by.binding('vm.suggestionTitle'));
//
//        //Need to EC it because when we load we need to wait for the model to update
//        browser.wait(EC.textToBePresentInElement(suggestionTitle,"Google Suggestions"), 5000, "No suggestionTitle present");
//        expect((suggestionTitle).getText()).toBe("Google Suggestions");
//
//        var loadingLabel = element(by.id('loadingLabel'));
//        browser.wait(EC.invisibilityOf(loadingLabel), 10000, "loadingLabel is visible");
//
//        var suggestions = element.all(by.repeater('business in vm.businessData'));
//        var blah = suggestions.count();
//        expect(suggestions.count()).toBeGreaterThan(0);
//    });
//});

//NOTE: This would test the index page but we are auto logging in via the protractor.conf.js so this doesn't work.
//describe('VoteToEat Index Page', function() {
//    it('should have a title', function () {
//        browser.driver.get('http://localhost:3000');
//        expect(browser.driver.getTitle()).toEqual('Login - Vote To Eat');
//    });
//
//    it('should have the header', function () {
//        browser.driver.get('http://localhost:3000');
//        expect(browser.driver.findElement(by.tagName('h1')).getText()).toEqual('Vote To Eat!');
//    });
//
//    it('should have a login button', function () {
//        browser.driver.get('http://localhost:3000');
//        expect(browser.driver.findElement(by.id('submit-login')).getAttribute('value')).toMatch('Log in');
//    });
//});





//*******************Examples*******************
//HERE IS AN EXAMPLE OF HOW TO GET MULTIPLE ITEMS FROM AN ARRAY in a MODEL
    //var todoList = element.all(by.repeater('todo in todoList.todos'));
    //expect(todoList.count()).toEqual(3);
    //expect(todoList.get(2).getText()).toEqual('write a protractor test');
//*******************Examples*******************

//*******************Example using PAGES*******************
//var MainPage = function() {
//    this.greeting = element(by.binding('userName'));
//
//    this.get = function() {
//        browser.get('http://localhost:3000/main');
//    };
//
//};
//
//describe('Main Page', function() {
//    it('should display welcome message with the first name', function () {
//        var mainPage = new MainPage();
//        mainPage.get();
//        expect(mainPage.greeting.getText()).toEqual('Hello Kent!');
//    });
//});
//


//describe('Login in and out of Vote to eat', function() {
//    it('should change the page and then logout', function () {
//        browser.driver.get('http://localhost:3000');
//        browser.driver.findElement(by.id('email')).sendKeys('register@gividen.com');
//        browser.driver.findElement(by.id('password')).sendKeys('xabler');
//        browser.driver.findElement(by.id('submit-login')).click();
//        expect(browser.driver.findElement(by.tagName('h1')).getText()).toEqual('Hello Kent!');
//        browser.driver.findElement(by.id('logoutBtn')).click();
//        expect(browser.driver.findElement(by.id('submit-login')).getAttribute('value')).toMatch('Log in');
//    });
//});
//*******************Example using PAGES*******************