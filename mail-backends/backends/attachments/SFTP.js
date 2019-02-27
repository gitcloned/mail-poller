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

        let Client = require('ssh2-sftp-client');
        let sftp = new Client();

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
    
                    let tempDir = [tempFolder, id].join("/")
                    let tempFilePath = [tempDir, object.filename].join("/")
                    let remoteFilePath = [object.storage.folder, object.filename].join("/")
    
                    console.log("uploading file: %s", remoteFilePath)
    
                    sftp.put(object.data, remoteFilePath)
                        .then(() => {
                            console.log("uploaded file: %s", remoteFilePath)
                            callback(null)
                        })
                        .catch((err) => {
                            console.log(err)
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

                        console.log("err while uloading to SFTP, err: %s", err)

                        return callback(err)
                    }
    
                    callback(null)
                })
            })
        }).catch((err) => {
            console.log(err, 'catch error');

            sftp.end()
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