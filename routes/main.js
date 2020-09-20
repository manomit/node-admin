'use strict';

const passport = require('passport'),
      express = require('express'),
      csurf = require('csurf'),
      auth = require('../middlewares/auth'),
      Main = require('../controllers').mainCtrl;

const mainObj = new Main();
            
const csrfProtection = csurf({
    cookie: true
});

const router = express.Router();

router.get("/", csrfProtection, mainObj.login);

router.post('/', csrfProtection, passport.authenticate('local-login',{
    failureRedirect: '/',
    failureFlash: true
}), mainObj.loginSubmit);

router.get('/dashboard', auth, mainObj.dashBoard);

router.get('/logout', auth, csrfProtection, mainObj.logout);

router.get('/users', auth, csrfProtection, mainObj.listUser);

router.post('/users', auth, csrfProtection, mainObj.createOrUpdateUser);

router.post('/users/delete', auth, csrfProtection, mainObj.blockUser);

router.get('/change-password', auth, csrfProtection, mainObj.changePasswordGet);

router.post('/change-password', auth, csrfProtection, mainObj.changePasswordPost);

router.get('/discovery-section', auth, csrfProtection, mainObj.listDiscoverySection);

router.post('/discovery-section', auth, csrfProtection, mainObj.postDiscoverySection);

router.post('/discovery-section/delete', auth, csrfProtection, mainObj.deleteDiscoverySection);

router.get('/sounds/all-section', auth, csrfProtection, mainObj.listSoundSection);

router.post('/sounds/all-section', auth, csrfProtection, mainObj.postSoundSection);

router.post('/sounds/all-section/delete', auth, csrfProtection, mainObj.deleteSoundSection);

router.get('/sounds/all-sound', auth, csrfProtection, mainObj.listSound);

router.post('/sounds/all-sound', auth, csrfProtection, mainObj.postSound);

router.post('/sounds/all-sound/delete', auth, csrfProtection, mainObj.deleteSound);


router.get('/videos', auth, csrfProtection, mainObj.listVideo);

router.post('/videos', auth, csrfProtection, mainObj.postVideo);


router.post('/videos/delete', auth, csrfProtection, mainObj.deleteVideo);


router.get('/users/search-by-name', auth, csrfProtection, mainObj.searchUserByName);


router.get('/sounds/search-by-name', auth, csrfProtection, mainObj.searchSoundByName);



router.get('/sounds/language', auth, csrfProtection, mainObj.listLanguage);

router.post('/sounds/language', auth, csrfProtection, mainObj.postLanguage);

router.post('/sounds/language/delete', auth, csrfProtection, mainObj.deleteLanguage);

router.get('/admins', auth, csrfProtection, mainObj.listAdmin);

router.post('/admins', auth, csrfProtection, mainObj.createOrUpdateAdmin);

router.get('/profile-verification', auth, csrfProtection, mainObj.getUserProfileVerification);

router.post('/profile-verification', auth, csrfProtection, mainObj.uploadProfileData);

router.post('/profile-verification/status-change', auth, csrfProtection, mainObj.profileDataStatusChange);

// router.get('/signup', mainObj.adminSignup);

module.exports = router;