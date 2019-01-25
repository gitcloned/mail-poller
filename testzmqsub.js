

var zmq = require('zeromq'),
    pub = zmq.socket('pub'),
    sub = zmq.socket('sub')


setTimeout(function() {

    sub.connect('tcp://127.0.0.1:3100')
    sub.subscribe("airline")

    console.log("subscriber ready at 3100 for topic 'airline'\n")

    sub.on('message', function(topic, message) {
        console.log("-received")
        console.log([topic.toString(), message.toString()])
    })
}, 1000)