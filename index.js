if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const Users = require('./fakedb/users')
const Complaints = require('./fakedb/complaints')

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/abc-complaints';
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log("Database connected");
})

app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
    console.log(mongoose.connection.readyState);
});

app.get('/users', (req, res) => {
    res.send(Users.getAll());
});

app.get('/complaints', (req, res) => {
    const userId = 123; //TODO: GET FROM REQ.USER
    const admin = true; //TODO: GET IF ADMIN FROM REQ.USER
    if (admin) {
        res.send(Complaints.getAll());
    } else {
        res.send(Complaints.getByAuthorId(userId));
    }
});

app.post('/complaints', (req, res) => {
    const userId = 123; //TODO: GET FROM REQ.USER
    const complaint = req.body.complaint;
    complaint.author_id = userId;
    const newComplaint = Complaints.addComplaint(complaint);
    res.send(newComplaint);
})

app.get('/complaints/:id', (req, res) => {
    const {id} = req.params;
    res.send(Complaints.getById(id));
});




app.listen(3000, () => console.log(`Listening on port 3000...`));
