const mongoose = require('mongoose');
const Schema = mongoose.Schema;

ComplaintSchema = new Schema({
    department: {
        type: String,
        enum: ['Sales', 'Accounting', 'Management', 'Customer Support'],
        required: true
    },
    title: String,
    description: String,
    status: {
        type: String,
        enum: ['Resolved', 'Pending resolution', 'Dismissed'],
        default: 'Pending resolution'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Complaint', ComplaintSchema);
