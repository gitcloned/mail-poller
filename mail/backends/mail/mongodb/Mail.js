const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const mailSchema = new Schema({
    messageId: String,
    headers: Object,
    from: Array,
    to: Array,
    subject: String,
    body: Object,
    attachments: Array,
    date: Date
});

module.exports.get = (mongoose) => {

    return mongoose.model('Mail', mailSchema);
}