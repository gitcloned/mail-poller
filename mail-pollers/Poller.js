const mongoose = require('mongoose')
const moment = require('moment')

var EventEmitter = require('events').EventEmitter

class Poller extends EventEmitter {

    constructor(clientname, name, mailAdapter, pollerConfig, mailBackend) {

        super()

        this.name = name
        this.clientname = clientname
        this.mailAdapter = mailAdapter
        this.pollerConfig = pollerConfig

        this.connection = null

        // parse freq, default: 30s
        this.pollerConfig.frequency = this.pollerConfig.frequency || '30s'
        this.pollerConfig.frequency = parseInt(this.pollerConfig.frequency)

        // search criteria
        this.search_criteria = JSON.parse(this.pollerConfig.search_criteria || '[["SINCE", "LAST_SEEN"]]')

        // fetch options
        this.fetch_options = JSON.parse(this.pollerConfig.fetch_options || '{ "bodies": ["HEADER", "TEXT"], "struct": true }')

        if (this.pollerConfig['mark_seen'] == 'false')
            this.fetch_options['markSeen'] = false
        else if (this.pollerConfig['mark_seen'] == 'true')
            this.fetch_options['markSeen'] = true

        this.backend = mailBackend
        this.interval = null

        this.started = false

        this.last_seen = null

        this.last_run = null
    }

    stop() {

        clearInterval(this.interval)
        this.interval = null
        this.started = false

        if (this.connection) {
            this.connection.close()
            this.connection = null
        }
    }

    parseSearchCriteria(run) {

        var search_criteria = this.search_criteria
        var parsed_search_criteria = []

        for (var i = 0; i < search_criteria.length; i++) {

            var criteria = search_criteria[i]

            if (criteria instanceof Array) {

                if (criteria[0] === "SINCE") {

                    var range = run.timeRangeCriteria(criteria[0], criteria[1], this.lastSeen())

                    for (var j = 0; j < range.length; j++) {
                        parsed_search_criteria.push(range[j])
                    }

                    continue
                }
            }

            parsed_search_criteria.push(criteria)
        }

        return parsed_search_criteria
    }

    start(callback) {

        if (this.started) callback(null)

        if (this.interval) this.stop()

        const mailAdapter = this.mailAdapter
        const config = this.pollerConfig
        const backend = this.backend
        const pollerName = this.name

        var that = this

        mailAdapter.connect().on('connect', (connection) => {

            that.started = true

            that.connection = connection
            that.connection.name = pollerName

            that.interval = setInterval(() => {

                if (that.last_run && that.last_run.isRunning()) {
                    console.log("Last run {%s} is still running", that.last_run.runId)
                    return
                }

                var run = backend.run(pollerName, config)

                that.last_run = run

                run.search_criteria = that.parseSearchCriteria(run)
                run.fetch_options = that.fetch_options

                mailAdapter.poll(connection, run, (err, results) => {

                    var errors = []
                    var saved_mails = []
                    var existing_mails = []

                    if (err) errors.push(err)

                    results = results || []

                    for (var i = 0; i < results.length; i++) {

                        if (results[i].value) {
                            if (results[i].value[1] === true) {
                                existing_mails.push(results[i].value[0])
                            } else {
                                saved_mails.push(results[i].value[0])
                            }
                        } else
                            errors.push(results[i].error)
                    }

                    if (saved_mails.length + existing_mails.length > 0) {

                        that.emit('mails', saved_mails, existing_mails, run.info())
                    }

                    // save run
                    run.save(errors, saved_mails, existing_mails)

                    // set the last seen as the current run created_at
                    that.last_seen = run.created_at
                })
            }, config.frequency * 1000)
        })

        console.log(" {%s} poller started", this.name)

        callback(null)
    }

    lastSeen() {

        if (!this.last_seen) {

            var max_look_back = (this.pollerConfig.max_look_back || "1 day").trim().split(/\s+/, 2)

            var since = moment.utc().subtract(parseInt(max_look_back[0]), max_look_back[1]).toDate()

            this.last_seen = since
        }

        return this.last_seen
    }
}

module.exports = Poller