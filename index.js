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
const flash = require('connect-flash');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');


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
const secret = process.env.SECRET || 'secret123';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
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
app.use('/', userRoutes);
app.use('/complaints', complaintRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    res.status(404).render('error', { statusCode: 404, message: 'Page not found.' });
})

//Error Handling
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).render('error', { statusCode: 500, message: 'Something went wrong.' });
});

app.listen(3000, () => console.log(`Listening on port 3000...`));
