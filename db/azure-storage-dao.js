var azure = require('azure-storage');
var auth_config = require('../auth/auth-conf');
var _ = require('underscore');

var blobSvc = azure.createBlobService('sssblob', auth_config.azureBlobStorage.key);


//create a container/snippet
// blobSvc.createContainerIfNotExists('mycontainer', {publicAccessLevel : 'blob'}, function(error, result, response){
//     if(!error){
//         // Container exists and is private
//     }
// });


//Delete a container
//I don't see this in the docs exactly but it looks to be in the code...the docs don't seem to have examples for this.
//https://github.com/Azure/azure-storage-node/blob/master/lib/services/blob/blobservice.js
// blobSvc.deleteContainer(containerName, 'myblob', function(error, response){
//     if(!error){
//         // Blob has been deleted
//     }
// });


exports.createContainer = function (container, next) {
    //create the container/snippet if needed then add the file to the container
    //container names have to be lowercase
    blobSvc.createContainerIfNotExists(container.toLowerCase(), {publicAccessLevel: 'blob'}, function (err, result, response) {
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};

exports.deleteContainer = function (container, next) {
    //create the container/snippet if needed then add the file to the container
    //container names have to be lowercase
    blobSvc.deleteContainerIfExists(container.toLowerCase(), function (err, result, response) {
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};


exports.addFile = function (container, fileName, content, next) {
    //create the container/snippet if needed then add the file to the container
    blobSvc.createContainerIfNotExists(container.toLowerCase(), {publicAccessLevel : 'blob'}, function(err, result, response){
        if (err) {
            return next(err);
        }
        //create a blob in a container  there are these options.
        // createBlockBlobFromLocalFile - creates a new block blob and uploads the contents of a file
        // createBlockBlobFromStream - creates a new block blob and uploads the contents of a stream
        // createBlockBlobFromText - creates a new block blob and uploads the contents of a string
        // createWriteStreamToBlockBlob - provides a write stream to a block blob

        // blobSvc.createBlockBlobFromLocalFile('mycontainer', 'myblob', 'test.txt', function(error, result, response){

        //The result returned by these methods contains information on the operation, such as the ETag of the blob.

        blobSvc.createBlockBlobFromText(container.toLowerCase(), fileName, content, function(err, result, response){
            if (err) {
                return next(err);
            }
            next(err, result, response);
        });
    });
};

exports.deleteFile = function (container, fileName, next) {
    //Delete a blob from a container
    blobSvc.deleteBlob(container, fileName, function(err, result){
        if (err) {
            return next(err);
        }
        next(err, result);
    });
};



//list blobs in a container/snippet
exports.getContainerContents = function (container, next) {
    blobSvc.listBlobsSegmented(container.toLowerCase(), null, function (err, result, response) {
        if (err) {
            return next(err);
        }
        // result.entries contains the entries
        // If not all blobs were returned, result.continuationToken has the continuation token.
        next(err, result, response);
    });
};

