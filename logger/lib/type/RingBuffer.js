var EventEmitter = require('events').EventEmitter,
    util = require('util');

/** from node-bunyan project
 * RingBuffer is a Writable Stream that just stores the last N records in
 * memory.
 *
 * @param options {Object}, with the following fields:
 *
 *    - limit: number of records to keep in memory
 */
var RingBuffer = module.exports = function (options) {
    this.limit = options && options.limit ? options.limit : 100;
    this.writable = true;
    this.records = [];
    
    this.filters = {};
    
    EventEmitter.call(this);
}

util.inherits(RingBuffer, EventEmitter);

RingBuffer.prototype.write = function (record) {
    if (!this.writable)
        throw (new Error('RingBuffer has been ended already'));
       
    var fk = [];
    if (typeof this.filters === "object" && (fk = Object.keys(this.filters)).length) {
        
        var matches = true;
        for (var i=0; i<fk.length; i++){
            if (record[fk[i]] != this.filters[fk[i]])
                matches = false;
                
           if (!matches)
            return (true);
        }
    }

    this.records.push(record);

    if (this.records.length > this.limit)
        this.records.shift();

    return (true);
};

RingBuffer.prototype.filter = function (filters) {
    
    this.filters = filters;

    return (true);
};

RingBuffer.prototype.end = function () {
    if (arguments.length > 0)
        this.write.apply(this, Array.prototype.slice.call(arguments));
    this.writable = false;
};

RingBuffer.prototype.destroy = function () {
    this.writable = false;
    this.emit('close');
};

RingBuffer.prototype.destroySoon = function () {
    this.destroy();
};