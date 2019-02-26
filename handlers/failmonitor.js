var SftpUpload = require('sftp-upload'),
    fs = require('fs'),
    async = require('async');

module.exports.handle = function (mails) {

    var options = {
            host: '54.76.125.226',
            username: 'root',
            path: '/',
            remoteDir: '/tempDir',
            privateKey: fs.readFileSync('privateKey_rsa'),
            passphrase: fs.readFileSync('privateKey_rsa.passphrase')
        },
        sftp = new SftpUpload(options);

}