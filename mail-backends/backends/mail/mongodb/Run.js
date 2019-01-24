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

    fetched_cnt: Number,
    saved_cnt: Number,

    saved_ids: Array,
    existing_ids: Array,

    total_time: Number,
    fetch_time: Number,

    failed: {
        type: Boolean,
        default: false
    },

    failures: Array,

    modules: Array,
    clientname: String
});

module.exports.get = (mongoose) => {

    return mongoose.model('Run', runSchema);
}