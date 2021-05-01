const Complaint = require('./models/complaint');

// Middleware to check if the user is logged in
module.exports.isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectURL = req.originalUrl;
        req.flash('error', 'You must be logged in to access this page.');
        return res.redirect('/login');
    }
    next();
}

// Middleware to check if user in an admin or is the author of the complaint
module.exports.isComplaintAuthorOrAdmin = async (req, res, next) => {
    const { id: complaintId } = req.params;
    const { _id: userId, admin } = req.user;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint.author.equals(userId) && !admin) {
        req.flash('error', 'You do not have the rights to view this page.');
        return res.redirect('/complaints');
    }
    next();
}

// Middleware to check if the user has admin rights
module.exports.isAdmin = (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error', 'You do not have permission.');
        return res.redirect('/complaints');
    }
    next();
}

// Function to catch asyn errors and pass them to next function
module.exports.catchAndPassAsyncError = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}