const format = require("string-template")
const async = require('async')

var SftpUpload = require('sftp-upload'),
    fs = require('fs');

class SFTP {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.tempFolder = this.config.tempFolder || "./temp"

        this.privateKey = fs.readFileSync(this.config.privateKey)
        this.passphrase = fs.readFileSync(this.config.passphrase)
    }

    init(callback) {


    }

    saveMail(id, mail, callback) {

        callback("SFTP does not support saving mail info")
    }

    saveBodyAndAttachments(id, mail, callback) {

        // console.log("saving mail body and attachments")

        var attachments = mail.attachments

        var body = mail.body

        const config = this.config

        const privateKey = this.privateKey
        const passphrase = this.passphrase
        const tempFolder = this.tempFolder

        var cleanup = (filePath) => {
            if (fs.existsSync(filePath))
                fs.rmdirSync(filePath)
        }

        var task = (object, next) => {

            return next(null, function (callback) {

                let tempFilePath = [tempFolder, id, object.filename].join("/")
                let remoteFilePath = [object.storage.folder, object.filename].join("/")

                fs.writeFileSync(tempFilePath, object.data)

                var options = {
                        host: config.host,
                        username: config.username,
                        path: tempFilePath,
                        remoteDir: remoteFilePath,
                        privateKey: privateKey,
                        passphrase: passphrase
                    },
                    sftp = new SftpUpload(options);

                console.log(' uploading: %s', remoteFilePath)

                sftp.on('error', function (err) {
                        cleanup(tempFilePath)
                        callback(err)
                    })
                    .on('uploading', function (progress) {
                        // console.log('Uploading ', progress.file);
                        // console.log(progress.percent + '% completed');
                    })
                    .on('completed', function () {
                        cleanup(tempFilePath)
                        console.log('  - upload completed: %s', remoteFilePath)
                        callback(null)
                    })
                    .upload();
            })
        }

        var objectsToSave = attachments.concat([body])

        /**
         * save mail objects
         */
        async.map(objectsToSave, task, (err, tasks) => {

            async.parallelLimit(tasks, 10, (err) => {

                if (err) {
                    return callback(err)
                }

                callback(null)
            })
        })
    }

    info(info, object) {

        return {
            "type": "sftp",
            "folder": format(this.folder, info)
        }
    }
}

module.exports = SFTP