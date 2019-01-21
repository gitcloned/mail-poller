const mongoose = require('mongoose')

class Poller {

    constructor(clientname, name, mailAdapter, pollerConfig, mailBackend) {

        this.name = name
        this.clientname = clientname
        this.mailAdapter = mailAdapter
        this.pollerConfig = pollerConfig

        // parse freq, default: 30s
        this.pollerConfig.frequency = this.pollerConfig.frequency || '30s'
        this.pollerConfig.frequency = parseInt(this.pollerConfig.frequency)


        this.modules = []

        this.backend = mailBackend
        this.interval = null

        this.started = false
    }

    stop() {

        clearInterval(this.interval)
        this.interval = null
        this.started = false
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

            mailAdapter.poll(run, (err, results) => {

                if (!err) {

                    console.log(results)

                    run.emitted({
                        modules: that.modules
                    })
                }

                // save run
                run.save()
            })
        }, config.frequency * 1000)
    }

    registerModule(module) {

        this.modules.push(module.name)
    }
}

module.exports = Poller