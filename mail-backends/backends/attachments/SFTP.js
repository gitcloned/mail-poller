const format = require("string-template")
const async = require('async')

var SftpUpload = require('sftp-upload'),
    fs = require('fs');

class SFTP {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.tempFolder = this.config.tempFolder || "./temp"

        this.privateKey = fs.readFileSync(this.config.privateKey).toString()
        this.passphrase = fs.readFileSync(this.config.passphrase).toString()

	this.folder = this.config.folder
    }

    init(callback) {


    }

    saveMail(id, mail, callback) {

        callback("SFTP does not support saving mail info")
    }

    saveBodyAndAttachments(id, mail, callback) {

        console.log("saving mail body and attachments: %s", id)

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

		let tempDir = [tempFolder, id].join("/")
                let tempFilePath = [tempDir, object.filename].join("/")
                let remoteFilePath = [object.storage.folder].join("/")

		try {
                    fs.mkdirSync(tempDir, { recursive: true })
		} catch (e) {}

                console.log(tempFilePath, remoteFilePath)

                fs.writeFileSync(tempFilePath, object.data)

                var options = {
                        host: config.host,
                        username: config.username,
                        path: tempDir,
                        remoteDir: remoteFilePath,
                        privateKey: privateKey,
                        passphrase: passphrase
                    },
                    sftp = new SftpUpload(options);

                console.log(' uploading: %s', remoteFilePath)
		console.log(options)

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
