const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');


router.get('/register', (req, res) => {
    res.render('users/register');
})

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

router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', passport.authenticate('local', { session: true, failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'You have successfully logged in.');
    redirectURL = req.session.redirectURL || '/complaints';
    delete req.session.redirectURL;
    res.redirect(redirectURL);
});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have successfully logged out.');
    res.redirect('/');
});

module.exports = router;
