var imaps = require('imap-simple')
const async = require('async')
var EventEmitter = require('events').EventEmitter;

var MailObject = require('./MailObject')

class Mailbox extends EventEmitter {

    constructor(clientname, config, mailBackend) {

        super()

        this.clientname = clientname
        this.mail_config = config['imap']
        this.connection_config = config['connection']
        this.mailBackend = mailBackend

        if (this.mail_config['port'])
            this.mail_config['port'] = parseInt(this.mail_config['port'])

        if (this.mail_config['tls'] == 'false')
            this.mail_config['tls'] = false
        else if (this.mail_config['tls'] == 'true')
            this.mail_config['tls'] = true

        this.connection_config['retry'] = this.connection_config['retry'] || {
            times: 0,
            interval: 1000
        }

        this.options = config

        this.connection = null;
    }

    connect(name) {

        if (this.connected()) return this

        const mail_config = this.mail_config
        const connection_config = this.connection_config

        var task = (callback) => {
            imaps.connect({
                "imap": mail_config
            }).then((connection) => {
                callback(null, connection)
            }).catch((err) => {
                callback(err)
            })
        }

        // console.log('connecting to mailbox: %s', mail_config.user)

        var that = this
        async.retry(connection_config.retry, task, (err, result) => {

            if (err) {
                console.log({
                    message: "Unable to connect to imap server",
                    details: err,
                    config: mail_config
                })
                return;
            }

            result.name = name
            that.connected(result, name)
        })

        return this
    }

    connected(connection, name) {

        if (!connection) {

            return this.connection !== null
        }

        // this.connection = connection

        this.emit('connect.' + name, connection)
    }

    parseFetchOptions(fetch_options) {
        return fetch_options
    }

    parseSearchCriteria(search_criteria) {
        return JSON.parse(search_criteria)
    }

    poll(connection, run, callback) {

        var search_criteria = run.searchCriteria()
        var fetch_options = run.fetchOptions()

        // Fetch emails from the last 24h
        // var delay = 1 * 24 * 3600 * 1000;
        // var yesterday = new Date();
        // yesterday.setTime(Date.now() - delay);
        // yesterday = yesterday.toISOString();
        // search_criteria = [['SINCE', yesterday]];
        // fetch_options = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true }
        // fetch_options = { bodies: ['HEADER', 'TEXT'], struct: true }

        // var connection = this.connection
        var clientname = this.clientname
        var mailBackend = this.mailBackend

        let box = run.box() || this.options.box

        connection.openBox(box).then(function () {

            console.log(connection.name, search_criteria, fetch_options)

            return connection.search(search_criteria, fetch_options)

        }).then((mails) => {

            mails = [mails[0]]

            run.fetched(mails.length)

            console.log(" - [%s] got %s mails {%s} with conn: %s", box, mails.length, run.runId, connection.name)

            var task = (mail, next) => {

                return next(null, async.reflect(function (callback) {
                    console.log(mail)
                    new MailObject(clientname, run.info().poller, mail).save(mailBackend, connection, run.info(), callback)
                }))
            }

            /**
             * save mail objects
             */
            async.map(mails, task, (err, tasks) => {

                async.parallelLimit(tasks, 10, (err, results) => {

                    if (err) {

                        return callback({
                            at: "saving",
                            err: err
                        })
                    }

                    callback(null, results)
                })
            })
        }).catch((err) => {

            console.log(err)

            callback({
                at: "fetching",
                err: err
            })
        })
    }
}

module.exports = Mailbox
