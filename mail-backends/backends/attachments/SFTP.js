const format = require("stringformat")
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
        this.filename = this.config.filename
    }

    init(callback) {


    }

    saveMail(id, mail, callback) {

        callback("SFTP does not support saving mail info")
    }

    saveBodyAndAttachments(id, mail, callback) {

        var attachments = mail.attachments

        var body = mail.body

        const config = this.config

        const privateKey = this.privateKey
        const passphrase = this.passphrase
        const tempFolder = this.tempFolder

        let Client = require('ssh2-sftp-client');
        let sftp = new Client();

        // sftp.once('error', (err) => {
        //     callback(err)
        // })

        var options = {
            host: config.host,
            username: config.username,
            privateKey: privateKey,
            passphrase: passphrase
        }

        sftp.connect(options).then(() => {

            console.log("connected to SFTP")

            var cleanup = (filePath) => {
                if (fs.existsSync(filePath))
                    fs.rmdirSync(filePath)
            }

            var task = (object, next) => {

                return next(null, function (callback) {

                    if (object.storage === null) return callback(null)

                    let tempDir = [tempFolder, id].join("/")
                    let tempFilePath = [tempFolder, object.storage.filename].join("/")
                    let remoteFilePath = [object.storage.folder, object.storage.filename].join("/")

                    fs.writeFileSync(tempFilePath, object.data)

                    console.log("\nuploading file %s: %s", typeof object.data, remoteFilePath)

                    sftp.put(Buffer.from(object.data), remoteFilePath)
                        .then(() => {
                            console.log(" - uploaded file: %s", remoteFilePath)
                            callback(null)
                        })
                        .catch((err) => {
                            callback(err)
                        })

                })
            }

            var objectsToSave = attachments.concat([body])

            /**
             * save mail objects
             */
            async.map(objectsToSave, task, (err, tasks) => {

                async.parallelLimit(tasks, 10, (err) => {

                    sftp.end()

                    if (err) {
                        return callback(err)
                    }

                    callback(null)
                })
            })
        }).catch((err) => {
            callback(err)
            sftp.end()
        })


    }

    info(info, object) {

        return {
            "type": "sftp",
            "folder": format(this.folder, info),
            "filename": this.filename ? format(this.filename, info) : this.filename
        }
    }
}

module.exports = SFTP
