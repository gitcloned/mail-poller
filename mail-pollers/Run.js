const uuidv1 = require('uuid/v1')
const moment = require('moment')

class Run {

    constructor(pollerName, pollerConfig, clientName, Model) {

        this.pollerName = pollerName
        this.pollerConfig = pollerConfig

        this.runId = uuidv1()
        this.clientName = clientName

        this.model = new Model()

        this.created_at = moment.utc().toDate()

        this.create({})

        this.search_criteria = null

        this.fetch_options = null
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

        this.model.save((err) => {
            console.log(err)
        })
    }

    /**
     * Mark run as fetched
     * @param {object} options 
     */
    fetched(options) {

        var fetched_at = moment.utc().toDate()

        this.model.fetched = options
        this.model.fetched_at = fetched_at
    }

    /**
     * Mark run as saved
     * @param {object} options 
     */
    saved(options) {

        var saved_at = moment.utc().toDate()

        this.model.saved_at = saved_at
    }

    /**
     * Mark run as emitted
     * @param {object} err
     */
    emitted(options) {

        var completed_at = moment.utc().toDate()

        this.model.completed_at = completed_at
    }

    /**
     * Mark run as failed
     * @param {object} err
     * @param {string} state
     */
    failed(err, state) {

        var completed_at = moment.utc().toDate()

        this.model.completed_at = completed_at
        this.model.failed_at = state
        this.model.failed = true
        this.model.failure_reason = err.toString()
    }

    save() {

        this.model.save((err) => {
            console.log(err)
        })
    }

    info() {

        return {

            poller: this.pollerName,
            clientname: this.clientName,
            id: this.runId,
            box: this.box()
        }
    }

    box() {
        return this.pollerConfig.box
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
            ]
        } else return [type, date]
    }
}

module.exports = Run