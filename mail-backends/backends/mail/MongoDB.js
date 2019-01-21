const dbinit = require('mongodb-igniter')
const format = require("string-template")
const mongoose = require('mongoose')
const mailModel = require('./mongodb/Mail')
const runModel = require('./mongodb/Run')

var Run = require('../../../mail-pollers/Run')

class MongoDB {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.db = format(this.config.db, {
            clientname: clientname.replace(/\s+/g, '')
        })

        this.model = null
        this.run_model = null
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
                    that.run_model = runModel.get(mongoose)

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

            mailDoc.from = mail.from
            mailDoc.to = mail.to
            mailDoc.subject = mail.subject
            mailDoc.date = new Date(mail.date)
            mailDoc.headers = mail.headers
            mailDoc.attachments = mail.attachments
            mailDoc.body = mail.body
            mailDoc.runInfo = mail.runInfo

            mailDoc.save((err) => {
                callback(err, false)
            })
        })
    }

    saveBodyAndAttachments(id, mail, callback) {

        callback("MongoDB does not support saving attachment")
    }

    info (messageId, date, object) {

        return {
            "type": "mongodb",
            "db": this.db
        }
    }

    run(pollerName, pollerConfig) {

        return new Run(pollerName, pollerConfig, this.clientname, this.run_model)
    }
}

module.exports = MongoDB