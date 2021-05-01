if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const MongoStore = require('connect-mongo');
const User = require('./models/user');
const Complaint = require('./models/complaint');
const flash = require('connect-flash');
const { isAuthenticated, isComplaintAuthorOrAdmin, isAdmin } = require('./middleware');
const user = require('./models/user');

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

app.use(methodOverride("_method"));
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
    req.flash('success', 'You have successfully logged out.');
    res.redirect('/');
})

app.get('/complaints/add', isAuthenticated, (req, res) => {
    //TODO render add complaint page
    res.render('./complaints/add');
});

app.post('/complaints', isAuthenticated, async (req, res) => {
    const complaint = new Complaint(req.body.complaint);
    complaint.author = req.user._id;
    await complaint.save();
    req.flash('success', 'Your complaint has been successfully submitted.');
    res.redirect(`/complaints/${complaint._id}`);
})

app.get('/complaints', isAuthenticated, async (req, res) => {
    const { admin, id } = req.user;
    const complaints = admin ? await Complaint.find({}).populate('author') : await Complaint.find({ author: id }).populate('author');
    res.render('complaints', { complaints });
});

app.get('/complaints/:id', isAuthenticated, isComplaintAuthorOrAdmin, async (req, res) => {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('author');
    res.render('./complaints/show', { complaint });
});

app.put('/complaints/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await Complaint.findByIdAndUpdate(id, { status: status });
    res.redirect(`/complaints/${id}`);
});


app.listen(3000, () => console.log(`Listening on port 3000...`));
