
class Poller {

    constructor (moduleName, mailAdapter, pollerConfig) {

        this.moduleName = moduleName
        this.mailAdapter = mailAdapter
        this.pollerConfig = pollerConfig

        this.pollerConfig.frequency = this.pollerConfig.frequency || '30s'

        this.pollerConfig.frequency = parseInt(this.pollerConfig.frequency)

        this.interval = null
    }

    stop () {

        clearInterval(this.interval)
        this.interval = null
    }

    start () {

        if (this.interval) this.stop()

        if (this.pollerConfig.enabled == 'false') return

        const mailAdapter = this.mailAdapter
        const config = this.pollerConfig

        this.interval = setInterval(() => {

            mailAdapter.poll(config.search_criteria, {}, (err, mails) => {

                console.log(err)
                console.log(mails)
            })
        }, config.frequency * 1000)
    }
}

module.exports = Poller