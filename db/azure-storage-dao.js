var azure = require('azure-storage');
var auth_config = require('../auth/auth-conf');

var blobSvc = azure.createBlobService(auth_config.azure.blobStorage.name, auth_config.azure.blobStorage.key);

var DEFAULT_CONTAINER = "sss-snippet-files";

exports.createContainer = function (container, next) {
    //create the container/snippet if needed then add the file to the container
    //container names have to be lowercase
    blobSvc.createContainerIfNotExists(DEFAULT_CONTAINER, {publicAccessLevel: 'blob'}, function (err, result, response) {
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};

exports.deleteFolder = function (folder, next) {
    //container names have to be lowercase
    blobSvc.listBlobsSegmentedWithPrefix(DEFAULT_CONTAINER, folder, null, function (err, blobs, response) {
        if (err) {
            return next(err);
        }
        if(blobs.entries.length > 0) {
            var itemsDeleted = 0;
            blobs.entries.forEach(function (blob) {
                blobSvc.deleteBlobIfExists(DEFAULT_CONTAINER, blob.name, function (err, result, response) {
                    if (err) {
                        return next(err);
                    }
                    itemsDeleted++;
                    if (itemsDeleted === blobs.entries.length) {
                        next(err, result, response);
                    }
                });
            });
        } else {
            next(err, response);
        }

    });
};

//It is the same call to add/update a file
exports.addUpdateFileByText = function (folder, fileName, content, next) {
    //The result returned by these methods contains information on the operation, such as the ETag of the blob.
    blobSvc.createBlockBlobFromText(DEFAULT_CONTAINER, folder + "/" + fileName, content, function(err, result, response){
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};


//It is the same call to add/update a file
exports.addUpdateFileByStream = function (folder, fileName, stream, len, next) {
    blobSvc.createBlockBlobFromStream(DEFAULT_CONTAINER, folder + "/" + fileName, stream, len, function(err, result, response){
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};

exports.deleteFile = function (folder, fileName, next) {
    //Delete a blob from a container
    blobSvc.deleteBlob(DEFAULT_CONTAINER, folder + "/" + fileName, function(err, result){
        if (err) {
            return next(err);
        }
        next(err, result);
    });
};


//list blobs in a folder in the default container
exports.getListOfFilesInFolder = function (folder, next) {
    blobSvc.listBlobsSegmentedWithPrefix(DEFAULT_CONTAINER, folder, null, function (err, result, response) {
        if (err) {
            return next(err);
        }
        result.entries.forEach(function(entry){
            entry.name = entry.name.replace(folder + "/",''); //remove the folder name prefix
        });
        //TODO if there is a continuation token keep getting them.
        // result.entries contains the entries
        // If not all blobs were returned, result.continuationToken has the continuation token.
        next(err, result, response);
    });
};

//get blob text in a container/snippet
exports.getBlobToText = function (folder, blobName, next) {
    blobSvc.getBlobToText(DEFAULT_CONTAINER, folder + "/" + blobName, function (err, response) {
        if (err) {
            return next(err);
        }
        next(err, response);
    });
};

