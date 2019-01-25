var zmq = require('zeromq')

var State = require('../enums/NodeState').NodeState;

class ZeroMQ {

    constructor(clientname, name, config) {

        this.clientname = clientname;

        this.name = name

        this.config = config;

        /**
         * zeromq producer
        */
        this.producer = zmq.socket('pub')

        /**
         * subscriber state
        */
        this._state = State.None;
    }

    get state() {
        return this._state;
    }

    set state(state) {

        if (state !== this.state)
            this._state = state;
    }

    connect(callback) {

        if (this.state === State.INITIALIZED) return callback(null, true)

        console.log(" [zeromq] connecting (pub) at %s", this.config.address)

        this.producer.monitor(1000, 0)
        this.producer.bindSync(this.config.address)

        var that = this

        this.producer.on('listen', () => {

            that.state = State.INITIALIZED

            callback(null)
        })
    }

    disconnect() {

        /**
         * if its already closed
        */
        if (this.state === State.CLOSED) return

        this.state = State.CLOSED;
    }

    publish(topic, message, options, callback) {

        // console.log(" [zeromq-producer] subscription changed: user: %s, state: %s", this.username, state)

        if (typeof options === "function") {

            callback = options;
            options = {}
        }

        var _on_error = function (err, callback) {

            console.log(err);

            return callback(err)
        }

        const clientname = this.clientname;

        var that = this;
        this.connect(function (err) {

            if (err) return _on_error(err, callback);

            var producer = that.producer;

            var payload = [topic, JSON.stringify(message)]

            if (!payload.length) return callback("Invalid payload, not an array or no item to publish");

            // console.log(" \n[zeromq] (%s) sending: %j", that.config.address, payload)

            producer.send(payload, null, callback)

            // callback(null, true)
        });
    }
};

module.exports = ZeroMQ
