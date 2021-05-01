const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');

// Render register page
router.get('/register', (req, res) => {
    res.render('users/register');
})

// Register and login a new user
router.post('/register', async (req, res) => {
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
});

// Render login page
router.get('/login', (req, res) => {
    res.render('users/login');
});

// Authenticate and login a user
router.post('/login', passport.authenticate('local', { session: true, failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'You have successfully logged in.');
    redirectURL = req.session.redirectURL || '/complaints'; // Redirect to page that unauthenticated user tried to visit
    delete req.session.redirectURL;
    res.redirect(redirectURL);
});

// Log user out and redirect to home page
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have successfully logged out.');
    res.redirect('/');
});

module.exports = router;
