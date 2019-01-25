

var zmq = require('zeromq'),
    pub = zmq.socket('pub'),
    sub = zmq.socket('sub')



pub.on('connect', function() {
    console.log("connected")
})
pub.on('connect_delay', function() {
    console.log("connect_delay")
})
pub.on('connect_retry', function() {
    console.log("connect_retry")
})
pub.on('disconnect', function() {
    console.log("disconnected")
})
pub.on('accept', function() {
    console.log("accept")
})
pub.on('listen', function() {
    console.log("listen")

    console.log("\nsend")
    pub.send(["airline", JSON.stringify({"event": "plain crashed", "no": "AI123"})])
})

// setInterval(function() {
//     console.log("\nsend")
//     pub.send(["airline", JSON.stringify({"event": "plain crashed", "no": "AI123"})])
// }, 4000)

pub.monitor(500, 0)

pub.bindSync('tcp://127.0.0.1:3100')
console.log("publisher ready at 3100")