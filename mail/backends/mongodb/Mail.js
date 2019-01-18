const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const mailSchema = new Schema({
    messageId: String,
    header: Object,
    from: Array,
    to: Array,
    subject: String,
    date: Date
});

module.exports.get = (mongoose) => {

    return mongoose.model('Mail', mailSchema);
}