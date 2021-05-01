const express = require('express');
const router = express.Router();
const Complaint = require('../models/complaint');
const { isAuthenticated, isComplaintAuthorOrAdmin, isAdmin, catchAndPassAsyncError } = require('../middleware');

// Renders the new complaint page
router.get('/add', isAuthenticated, (req, res) => {
    res.render('./complaints/add');
});

// Add a new complaint and set current user as author
router.post('/', catchAndPassAsyncError(async (req, res) => {
    const complaint = new Complaint(req.body.complaint);
    complaint.author = req.user._id;
    await complaint.save();
    req.flash('success', 'Your complaint has been successfully submitted.');
    res.redirect(`/complaints/${complaint._id}`);
}));

// Complaints index page; shows complaints by current user or all complaints if user is an admin
router.get('/', isAuthenticated, catchAndPassAsyncError(async (req, res) => {
    const { admin, id } = req.user;
    const complaints = admin ? await Complaint.find({}).populate('author') : await Complaint.find({ author: id }).populate('author');
    res.render('complaints', { complaints });
}));

// Renders the view complaint page if current user is the author or an admin, redirects otherwise
router.get('/:id', isAuthenticated, catchAndPassAsyncError(isComplaintAuthorOrAdmin), catchAndPassAsyncError(async (req, res) => {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('author');
    res.render('./complaints/show', { complaint });
}));

// Update the status of the complaint; to be used only if current user is an admin
router.put('/:id', isAuthenticated, isAdmin, catchAndPassAsyncError(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await Complaint.findByIdAndUpdate(id, { status: status });
    req.flash('success', 'Status successfully changed.');
    res.redirect(`/complaints/${id}`);
}));

module.exports = router;
