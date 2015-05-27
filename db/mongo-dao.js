exports.fakeFunction = function () {
    return "taco";
}


// var mongoskin = require('mongoskin');
// var config = require('../config');

// var db = mongoskin.db(config.mongoUri, {safe:true});
// db.bind('groups');
// db.bind('users');

// //GROUPS
// exports.addGroup = function(group, next) {
//     db.groups.find({name: group.name}).toArray(function(err, items){
//         //If groups doesn't exist then add them
//         if(items[0]){
//             next("Group already exists");  //probably should throw a 404 or something here.
//         } else {
//             db.groups.insert(group, {}, function (err, results) {
//                 next(err, results);
//             });
//         }
//     });
// };

// exports.findGroup = function (group, next){
//     db.groups.find({name: group.name}).toArray(function(err, items){
//         console.log("items: " + JSON.stringify(items));
//         //If groups doesn't exist then add them
//         if (items[0]){
//             next(err, items[0]);
//         } else {
//             next("Group doesn't exist");
//         }
//     });
// } ;

// exports.removeGroup = function(user, next) {
//     db.groups.remove({email: user.email}, function(err){
//         next(err);
//     });
// };



// //USERS
// exports.findUser = function(user, next) {
//     db.users.find({email: user.email}).toArray(function(err, items){
//         if(items[0]){
//             next(err, items[0]);
//         } else {
//             next("User not found");  //probably should throw a 404 or something here.
//         }
//     });
// };

// exports.addUser = function(user, next) {
//     db.users.find({email: user.email}).toArray(function(err, items){
//         //If groups doesn't exist then add them
//         if(items[0]){
//             next("User already exists");  //probably should throw a 404 or something here.
//         } else {
//             db.users.insert(user, {}, function (err, results) {
//                 next(err, results);
//             });
//         }
//     });
// };

// exports.removeUser = function(user, next) {
//     db.users.remove({email: user.email}, function(err){
//         next(err);
//     });
// };


//FUTURE TODO SECTION

//editing an existing snippet
//update one snippet and return 204 NO CONTENT
//patch /sss/idm/:id
//db.idm.update({_id=":id"}, json);

//2 ops for collections
//create new blank list of snippets and return 201 CREATED
//put /sss/foo
//db.createCollection("foo");

//delete foo list of snippets and return 204 NO CONTENT
//delete /sss/foo
//db.foo.remove();

