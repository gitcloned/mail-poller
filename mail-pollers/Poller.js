const mongoose = require('mongoose')
const moment = require('moment')

class Poller {

    constructor(clientname, name, mailAdapter, pollerConfig, mailBackend) {

        this.name = name
        this.clientname = clientname
        this.mailAdapter = mailAdapter
        this.pollerConfig = pollerConfig

        // parse freq, default: 30s
        this.pollerConfig.frequency = this.pollerConfig.frequency || '30s'
        this.pollerConfig.frequency = parseInt(this.pollerConfig.frequency)

        // search criteria
        this.search_criteria = JSON.parse(this.pollerConfig.search_criteria || '[["SINCE", "LAST_SEEN"]]')

        // fetch options
        this.fetch_options = JSON.parse(this.pollerConfig.fetch_options || '{ "bodies": ["HEADER", "TEXT"], "struct": true }')

        this.modules = []

        this.backend = mailBackend
        this.interval = null

        this.started = false

        this.last_seen = null
    }

    stop() {

        clearInterval(this.interval)
        this.interval = null
        this.started = false
    }

    parseSearchCriteria(run) {

        var search_criteria = this.search_criteria
        var parsed_search_criteria = []

        for (var i = 0; i < search_criteria.length; i++) {

            var criteria = search_criteria[i]

            if (criteria instanceof Array) {

                if (criteria[0] === "SINCE") {

                    var range = run.timeRangeCriteria(criteria[0], criteria[1], this.lastSeen())

                    for (var j=0; j<range.length; j++) {
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

        that.started = true

        that.interval = setInterval(() => {

            var run = backend.run(pollerName, config)

            run.search_criteria = that.parseSearchCriteria(run)
            run.fetch_options = that.fetch_options

            mailAdapter.poll(run, (err, results) => {

                if (!err) {

                    console.log(results)

                    run.emitted({
                        modules: that.modules
                    })
                }

                // save run
                run.save()

                // set the last seen as the current run created_at
                that.last_seen = run.created_at
            })
        }, config.frequency * 1000)
    }

    registerModule(module) {

        this.modules.push(module.name)
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