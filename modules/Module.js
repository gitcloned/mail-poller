
var Poller = require('../mail-adapters/Poller')

class Module {

    constructor (name, config) {

        this.name = name
        this.config = config

        this.config.mail = this.config.mail || { poller: null }

        this.poller = null
    }

    setPollerWithAdapter (mailAdapter) {

        if (this.poller) this.poller.stop()

        this.poller = new Poller(this.name, mailAdapter, this.config.mail.poller)

        this.poller.start()
    }
}

module.exports = Module