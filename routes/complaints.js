const express = require('express');
const router = express.Router();
const Complaint = require('../models/complaint');
const { isAuthenticated, isComplaintAuthorOrAdmin, isAdmin, catchAndPassAsyncError } = require('../middleware');


router.get('/add', isAuthenticated, (req, res) => {
    res.render('./complaints/add');
});

router.post('/', catchAndPassAsyncError(async (req, res) => {
    const complaint = new Complaint(req.body.complaint);
    complaint.author = req.user._id;
    await complaint.save();
    req.flash('success', 'Your complaint has been successfully submitted.');
    res.redirect(`/complaints/${complaint._id}`);
}));

router.get('/', isAuthenticated, catchAndPassAsyncError(async (req, res) => {
    const { admin, id } = req.user;
    const complaints = admin ? await Complaint.find({}).populate('author') : await Complaint.find({ author: id }).populate('author');
    res.render('complaints', { complaints });
}));

router.get('/:id', isAuthenticated, catchAndPassAsyncError(isComplaintAuthorOrAdmin), catchAndPassAsyncError(async (req, res) => {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('author');
    res.render('./complaints/show', { complaint });
}));

router.put('/:id', isAuthenticated, isAdmin, catchAndPassAsyncError(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await Complaint.findByIdAndUpdate(id, { status: status });
    req.flash('success', 'Status successfully changed.');
    res.redirect(`/complaints/${id}`);
}));

module.exports = router;
