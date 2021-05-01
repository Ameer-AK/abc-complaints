const Complaint = require('./models/complaint');

module.exports.isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectURL = req.originalUrl;
        req.flash('error', 'You must be logged in to access this page.');
        return res.redirect('/login');
    }
    next();
}

module.exports.isComplaintAuthorOrAdmin = async (req, res, next) => {
    const { id: complaintId } = req.params;
    const { _id: userId, admin } = req.user;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint.author.equals(userId) && !admin) {
        req.flash('error', 'You do not have to view this page.');
        return res.redirect('/complaints');
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error', 'You do not have permission.');
        return res.redirect('/complaints');
    }
    next();
}

module.exports.catchAndPassAsyncError = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}