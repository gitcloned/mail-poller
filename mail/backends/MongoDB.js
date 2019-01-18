const dbinit = require('mongodb-igniter')
const format = require("string-template")
const mongoose = require('mongoose')
const mailModel = require('./mongodb/Mail')

class MongoDB {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.db = format(this.config.db, {
            clientname: clientname.replace(/\s+/g, '')
        })

        this.model = null
    }

    init(callback) {

        if (this.config.init) {

            const init_config = require(this.config.init)

            var db = this.db
            init_config.db = db

            console.log(db)

            var that = this

            dbinit.initializeDb(init_config)
                .then(result => {

                    mongoose.connect(db)

                    that.model = mailModel.get(mongoose)

                    console.log(' - initialization completed\n')
                    callback(null)
                })
                .catch(err => {
                    console.log(' - initialization failed.  Error: ' + err.toString() + '\n')
                    callback(err)
                })
        }
    }

    saveMail(id, mail, callback) {

        var Model = this.model

        Model.findOne({messageId: id}, (err, mailDoc) => {

            if (err) {
                return callback(err)
            }

            if (mailDoc) {
                return callback(null, true)
            }

            var mailDoc = new Model()

            mailDoc.messageId = id
            mailDoc.from = mail.from()
            mailDoc.to = mail.to()
            mailDoc.subject = mail.subject()
            mailDoc.date = new Date(mail.date())

            var headers = mail.headers()

            mailDoc.header = {
                'content-type': headers['content-type'],
                'mime-version': headers['mime-version'],
                'return-path': headers['return-path'],
                'received': headers['received'],
                'content-transfer-encoding': headers['content-transfer-encoding']
            }

            mailDoc.save(callback)
        })
    }

    saveAttachments(id, attachments, callback) {

        callback("MongoDB does not support saving attachment")
    }
}

module.exports = MongoDB