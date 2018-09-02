const fs = require('file-system');
const documents = fs.knownFolders.currentApp();

module.exports = {
    readJSON: function (path) {
        let jsonFile = documents.getFile(path);
        
        return new Promise(function (resolve, reject) {
            try {
                jsonFile.readText().then(function (content) {
                    let data = JSON.parse(content);
                    resolve(data);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
};