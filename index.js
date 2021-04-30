if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo');
const User = require('./models/user');
const Users = require('./fakedb/users')
const Complaints = require('./fakedb/complaints')
const flash = require('connect-flash');


//DB Connection
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

//Rendering Setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));


//Session Setup
const secret = process.env.SECRET || 'thisshouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
})

//TODO this
const sessionConfig = {
    store,
    name: 'xzr',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7 * 1,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 1
    }
}
app.use(session(sessionConfig));

app.use(flash());

//Passport Auth Setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Add locals to for global access
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


//Routes
app.get('/', (req, res) => {
    res.render('home');
    console.log(mongoose.connection.readyState);
});


app.get('/register', (req, res) => {
    res.render('users/register');
})

app.post('/register', async (req, res) => {
    //TODO register user
    try {
        const { username, email, password, first, last, age, gender } = req.body
        const user = new User({ email, username, age, gender, first, last });
        const registered = await User.register(user, password);
        req.login(registered, (err) => {
            if (err) return next(err);
            req.flash('success', 'Thank you for registering.')
            res.redirect('/complaints');
        })
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/register');
    }
})

app.get('/login', (req, res) => {
    res.send('welcome to login page');
    //TODO: render login page
});

app.post('/login', (req, res) => {
    //TODO: log user in
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' });
    req.flash('success', 'You have successfully logged in.');
    redirectURL = req.session.redirectURL || '/complaints';
    delete req.session.redirectURL;
    res.redirect(redirectURL);
})

app.post('/logout', (req, res) => {
    //TODO: log user out
    req.logout();
    req.flash('success', 'You have successfully logged out.')
    res.redirect('/');
})

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

app.get('/complaints/add', (req, res) => {
    res.send('complaint add page');
    //TODO render add complaint page
});

app.get('/complaints/:id', (req, res) => {
    const { id } = req.params;
    res.send(Complaints.getById(id));
    //TODO complaint show page (status can be edited by admin)
});

app.put('/complaints/:id', (req, res) => {
    res.send('complaint status edited!');
    //TODO change complaint status 
});

app.listen(3000, () => console.log(`Listening on port 3000...`));
