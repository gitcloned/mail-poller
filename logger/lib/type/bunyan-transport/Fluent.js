var EventEmitter = require('events').EventEmitter,
    util = require('util');

const DEFAULT_TAG = 'PositionAggregator';
const DEFAULT_LEVEL = 'info';

/** from node-bunyan project
 * Fluent is a Writable Stream that emits to fluent
 *
 */
var Fluent = module.exports = function (level, sender) {

    if (arguments.length === 0) {
        throw (new Error('No Fluent sender provided'));
    } else {
        if (typeof level === 'object') {
            sender = level;
            level = DEFAULT_LEVEL;
        }
    }

    this.writable = true;

    this.level = level;

    this.sender = sender;

    this.sender.on('error', function(err) {
        // console.log("Error occurred with fluent d logger");
    })
    
    EventEmitter.call(this);
}

util.inherits(Fluent, EventEmitter);

Fluent.prototype.write = function (record, callback) {
    if (!this.writable)
        throw (new Error('Fluent has been ended already'));
       
    var sender = this.sender;

    var data = record;    
    
    sender.emit(data, (error) => {
        if (error) {
            this.emit('error', error);
            // callback(error, false);
        } else {
            // this.emit('logged');
            // callback(null, true);
        }
    });

    return (true);
};

Fluent.prototype.filter = function (filters) {
    
    this.filters = filters;

    return (true);
};

Fluent.prototype.end = function () {
    if (arguments.length > 0)
        this.write.apply(this, Array.prototype.slice.call(arguments));
    this.writable = false;
};

Fluent.prototype.destroy = function () {
    this.writable = false;
    this.emit('close');
};

Fluent.prototype.destroySoon = function () {
    this.destroy();
};