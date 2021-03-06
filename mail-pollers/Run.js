const uuidv1 = require('uuid/v1')
const moment = require('moment')

class Run {

    constructor(pollerName, pollerConfig, clientName, Model) {

        this.pollerName = pollerName
        this.pollerConfig = pollerConfig

        let tags = JSON.parse(pollerConfig.tags || [])

        this.pollerTags = {}

        for (var i = 0; i < tags.length; i++) {
            this.pollerTags[tags[i][0]] = tags[i][1]
        }

        this.runId = uuidv1()
        this.clientName = clientName

        this.model = new Model()

        this.created_at = moment.utc().toDate()

        this.create({})

        this.search_criteria = null

        this.fetch_options = null

        this.failures = []

        this.completed = false

        this.heartbeat = 0
    }

    /**
     * Create the run
     * @param {object} options 
     */
    create(options) {

        this.model.runId = this.runId
        this.model.name = this.pollerName
        this.model.clientName = this.clientName
        this.model.created_at = this.created_at
        this.model.state = "Running"

        this.model.save((err) => {
            console.log(err)
        })
    }

    /**
     * Mark run as fetched
     * @param {object} options 
     */
    fetched(len) {

        var fetched_at = moment.utc().toDate()

        this.model.fetched_cnt = len
        this.model.fetched_at = fetched_at

        this.model.fetch_time = fetched_at - this.created_at
    }

    /**
     * Mark run as saved
     * @param {object} options 
     */
    saved(mails) {

        var saved_at = moment.utc().toDate()

        this.model.saved_at = saved_at
    }

    save(errors, saved_mails, existing_mails) {

        this.model.saved_cnt = saved_mails.length
        this.model.saved_ids = saved_mails

        this.model.existing_ids = existing_mails

        this.model.completed_at = new Date()

        this.model.total_time = this.model.completed_at - this.created_at

        this.model.failures = this.failures.concat(errors)

        this.model.state = this.model.failures.length > 0 ? "Errored" : "Completed"

        this.complete()

        if (errors.length)
            console.log(errors)

        try {
            this.model.save((err) => {
                console.log(err)
            })
        } catch (e) {}
    }

    info() {

        return {

            poller: this.pollerName,
            clientname: this.clientName,
            id: this.runId,
            box: this.box(),
            tags: this.tags()
        }
    }

    box() {
        return this.pollerConfig.box
    }

    tags() {
        return this.pollerTags
    }

    searchCriteria() {
        return this.search_criteria
    }

    fetchOptions() {
        return this.fetch_options
    }

    timeRangeCriteria(type, date, lastSeen) {

        if (date === "LAST_SEEN" && type === "SINCE") {

            return [
                ["SENTSINCE", lastSeen.toISOString()],
                ["SENTBEFORE", this.created_at.toISOString()]
                //["SINCE", lastSeen.toISOString()],
                //["BEFORE", this.created_at.toISOString()]
            ]
        } else return [type, date]
    }

    complete() {

        this.completed = true
    }

    isRunning() {

        return this.completed !== true
    }

    stillRunning() {

        this.heartbeat++
    }

    kill() {

    }
}

module.exports = Run