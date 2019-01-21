const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const runSchema = new Schema({
    name: String,
    runId: String,
    
    created_at: Date,
    fetched_at: Date,
    completed_at: Date,
    saved_at:Date,
    emitted_at:Date,

    failed: {
        type: Boolean,
        default: false
    },

    failed_at: String,
    failure_reason: String,

    fetched: Object,

    modules: Array,
    clientname: String
});

module.exports.get = (mongoose) => {

    return mongoose.model('Run', runSchema);
}