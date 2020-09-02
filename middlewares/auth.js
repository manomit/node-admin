'use strict';

module.exports = (req, res, next) => {
    if(req.isAuthenticated()) {
        const urlArr = req.originalUrl.split("/");
        delete req.user.password;
        res.locals.user = req.user;
        res.locals.url = urlArr[1];
        res.locals.subUrl = urlArr.length > 1 ? urlArr[2] : '';
        return next();
    }
    res.redirect('/');
}