
const uuidv1 = require('uuid/v1')

class Run {

    constructor(pollerName, clientName, Model) {

        this.pollerName = pollerName
        this.runId = uuidv1()
        this.clientName = clientName

        this.model = new Model()

        this.create({})
    }

    /**
     * Create the run
     * @param {object} options 
     */
    create(options) {

        var created_at = new Date()

        this.model.runId = this.runId
        this.model.name = this.pollerName
        this.model.clientName = this.clientName
        this.model.created_at = created_at

        this.model.save((err) => {
            console.log(err)
        })
    }

    /**
     * Mark run as fetched
     * @param {object} options 
     */
    fetched(options) {

        var fetched_at = new Date()

        this.model.fetched = options
        this.model.fetched_at = fetched_at
    }

    /**
     * Mark run as saved
     * @param {object} options 
     */
    saved(options) {

        var saved_at = new Date()

        this.model.saved_at = saved_at
    }

    /**
     * Mark run as emitted
     * @param {object} err
     */
    emitted(options) {

        var completed_at = new Date()

        this.model.completed_at = completed_at
    }

    /**
     * Mark run as failed
     * @param {object} err
     * @param {string} state
     */
    failed(err, state) {

        var completed_at = new Date()

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
}

module.exports = Run