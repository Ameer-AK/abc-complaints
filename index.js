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
const { isLoggedIn } = require('./middleware')

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
    secret,
    resave: false,
    saveUninitialized: true,
    // secure: true,
    cookie: {
        httpOnly: true,
        secure: true,
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
            req.flash('success', 'You have successfully registered.')
            res.redirect('/complaints');
        })
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/register');
    }
})

app.get('/login', (req, res) => {
    res.render('users/login');
});

app.post('/login', passport.authenticate('local', { session: true, failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'You have successfully logged in.');
    redirectURL = req.session.redirectURL || '/complaints';
    delete req.session.redirectURL;
    res.redirect(redirectURL);
})

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have successfully logged out.')
    res.redirect('/');
})

app.get('/complaints/add', isLoggedIn, (req, res) => {
    res.send('complaint add page');
    //TODO render add complaint page
});

app.post('/complaints', isLoggedIn, (req, res) => {
    const userId = 123; //TODO: GET FROM REQ.USER
    const complaint = req.body.complaint;
    complaint.author_id = userId;
    const newComplaint = Complaints.addComplaint(complaint);
    res.send(newComplaint);
})

app.get('/complaints', isLoggedIn, (req, res) => {
    const userId = 123; //TODO: GET FROM REQ.USER
    const admin = true; //TODO: GET IF ADMIN FROM REQ.USER
    res.render('complaints');
});

app.get('/complaints/:id', isLoggedIn, (req, res) => {
    const { id } = req.params;
    res.send(Complaints.getById(id));
    //TODO complaint show page (status can be edited by admin)
});

app.put('/complaints/:id', isLoggedIn, (req, res) => {
    res.send('complaint status edited!');
    //TODO change complaint status 
});

app.listen(3000, () => console.log(`Listening on port 3000...`));
