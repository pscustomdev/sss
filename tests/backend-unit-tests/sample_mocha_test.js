//'use strict';
//console.log("**** (Backend Unit Testing [MOCHA]: 'mongo-dao-spec') ****");
//
//var mongoose = require('mongoose');
//var db;
//
//describe('User', function() {
//
//  before (function(done) {
//    db = mongoose.connect('mongodb://localhost/test');
//    done();
//  });
//
//  after (function(done) {
//    mongoose.connection.close();
//    done();
//  });
//
//  beforeEach (function(done) {
//    var user = new User({
//      oauthID: 12345,
//      name: 'testy',
//      created: Date.now()
//    });
//
//    user.save(function(error) {
//      if (error) {
//        console.log('error' + error.message);
//      }
//      done();
//    });
//  });
//
//  it ('find a user by username', function(done) {
//    db.findById({ oauthID: 12345, name: "testy" }, function(err, user) {
//      user.name.should.equal('testy');
//      user.oauthID.should.equal(12345);
//      console.log("		name: ", user.name);
//      console.log("		oauthID: ", user.oauthID);
//      done();
//    });
//  });
//
//  afterEach (function(done) {
//    User.remove({}, function() {
//      done();
//    });
//  });
//
//});
//
