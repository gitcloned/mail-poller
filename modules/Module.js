var Poller = require('../mail-pollers/Poller')

class Module {

    constructor(name, config) {

        this.name = name
        this.config = config
    }

    setPoller(poller) {

        poller.registerModule(this)
    }
}

module.exports = Module