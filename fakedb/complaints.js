const { getAll } = require("./users");

module.exports = {
    complaints: [
        { id: 123, author_id: 123, department: 'sales', title: 'Bad price', text: 'I hate you so much', status: 'resolved' },
        { id: 456, author_id: 456, department: 'management', title: 'Bad timing', text: "I don't like you", status: 'pending' }
    ],
    getAll() { return this.complaints; },
    getById(id) { return this.complaints.filter((complaint) => complaint.id == id) },
    getByAuthorId(id) { return this.complaints.filter(complaint => complaint.author_id === id) },
    addComplaint(complaint) {
        complaint.id = 6969;
        complaint.status = 'pending';
        this.complaints.push(complaint);
        return complaint;
    }

}