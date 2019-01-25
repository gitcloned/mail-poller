class Subscriber {

    constructor(clientname, config) {

        this.clientname = clientname

        this.agent = null

        switch (config.type) {

            case 'kafka':
                var Agent = require('./type/KafkaSub')
                this.agent = new Agent(clientname, "kafka", config)
                break

            case 'redis':
                var Agent = require('./type/RedisSub')
                this.agent = new Agent(clientname, "redis", config)
                break

            case 'zeromq':
                var Agent = require('./type/ZeroMQSub')
                this.agent = new Agent(clientname, "zeromq", config)
                break
        }
    }

    subscribe(topic, callback) {

        this.agent.subscribe(topic, callback)
    }
}

module.exports = Subscriber