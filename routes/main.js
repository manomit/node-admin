'use strict';

const express = require('express'),
      passport = require('passport'),
      csurf = require('csurf'),
      Admin = require('../db/mongo/schemas').adminSchema,
      User = require('../db/mongo/schemas').userSchema,
      DiscoverySection = require('../db/mongo/schemas').discoverSectionSchema,
      SoundSection = require('../db/mongo/schemas').soundSectionSchema,
      SoundData = require('../db/mongo/schemas').soundDataSchema,
      VideoData = require('../db/mongo/schemas').videoDataSchema,
      auth = require('../middlewares/auth'),
      {v4} = require('uuid'),
      { validationErrorObj } = require('../middlewares/validationError'),
      bCrypt = require('bcryptjs'),
      AWS = require('aws-sdk'),
      multer = require('multer'),
      multerS3 = require('multer-s3'),
      { extname } = require('path');
            
const csrfProtection = csurf({
    cookie: true
});

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
    signatureVersion: 'v4'
});

const uploadSound = multer({
    storage: multerS3({
        s3,
        bucket: process.env.BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            const fileExtName = extname(file.originalname);
            cb(null, `audio/${Date.now().toString()}${fileExtName}`)
        },
        cacheControl: 'max-age=31536000'
    })
});

const uploadVideo = multer({
    storage: multerS3({
        s3,
        bucket: process.env.BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            const fileExtName = extname(file.originalname);
            cb(null, `video/${Date.now().toString()}${fileExtName}`)
        },
        cacheControl: 'max-age=31536000'
    })
});

const router = express.Router();

router.get("/", csrfProtection, (req, res) => {
    const msg = req.flash('loginMessage')[0];
    
    res.render(
        'login',
        {
            layout: 'login',
            title: 'Login',
            message: msg,
            csrfToken: req.csrfToken()
        }
    );
});

router.post('/', csrfProtection, passport.authenticate('local-login',{
    failureRedirect: '/',
    failureFlash: true
}), async (req, res) => {
    if(req.user) {
        if (req.body.remember_me) {
            req.session.cookie.maxAge = 1000 * 60 * 3;
        } else {
            req.session.cookie.expires = false;
        }
        res.redirect('/users');
    }
});

router.get('/dashboard', auth, async (req, res) => {
    res.render(
        'dashboard',
        {
            layout: 'main'
        }
    )
});

router.get('/logout', auth, csrfProtection, (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/users', auth, csrfProtection, async(req, res) => {
    const data = await User.find({isBlocked: false}).sort({createdAt: 1}).lean();
    res.render(
        'users',
        {
            layout: 'main',
            title: 'All Users',
            data,
            csrfToken: req.csrfToken()
        }
    )
});

router.post('/users', auth, csrfProtection, async (req, res) => {
    const { username, name, device, _id } = req.body;

    try {
        if(_id) {
            await User.updateOne({
                _id
            }, {
                $set: {
                    username,
                    name,
                    device
                }
            });
            res.status(201).json({data: null, message: 'User updated successfully'});
        } else {
            const data = await User.create({
                userId: v4(),
                username,
                name,
                device
            });
            res.status(201).json({data, message: 'New user created successfully'});
        }
        
    } catch(error) {
        const data = validationErrorObj(error.message);
        res.status(500).json({data});
    }
});

router.post('/users/delete', auth, csrfProtection, async (req, res) => {
    await User.updateOne({
        _id: req.body._id
    }, {
        $set: {
            isBlocked: true
        }
    });
    res.status(201).json({data: null, message: 'User deleted successfully'});
});

router.get('/change-password', auth, csrfProtection, async (req, res) => {
    let isPasswordChanged = 0;
    const failMsg = req.flash('changePasswordMessageFail')[0];
    const successMsg = req.flash('changePasswordMessageSuccess')[0];
    isPasswordChanged = failMsg !== undefined ? 1 : (successMsg !== undefined ? 2 : 0)
    res.render(
        'change-password',
        {
            layout: 'main',
            title: 'Change Password',
            failMsg,
            successMsg,
            csrfToken: req.csrfToken(),
            isPasswordChanged
        }
    );
});

router.post('/change-password', auth, csrfProtection, async (req, res) => {
    const adminDetails = await Admin.findById(res.locals.user._id);
    const { old_password, new_password, confirm_password } = req.body;
    if (bCrypt.compareSync(old_password, adminDetails.password)) {
        await Admin.updateOne({
            _id: res.locals.user._id
        }, {
            $set: {
                password: bCrypt.hashSync(new_password)
            }
        });
        req.flash('changePasswordMessageSuccess', 'Password updated successfully');
        
    } else {
        req.flash('changePasswordMessageFail', 'Old password doesn\'t match');
    }
    res.redirect('/change-password');
});

router.get('/discovery-section', auth, csrfProtection, async(req, res) => {
    const data = await DiscoverySection.find({isDeleted: false}).sort({createdAt: -1}).lean();
    res.render(
        'discovery-section',
        {
            layout: 'main',
            title: 'Discovery Section',
            data,
            csrfToken: req.csrfToken()
        }
    )
});

router.post('/discovery-section', auth, csrfProtection, async (req, res) => {
    const { name, _id } = req.body;
    
    try {
        if(_id) {
            await DiscoverySection.updateOne({
                _id
            }, {
                $set: {
                    name
                }
            });
            res.status(201).json({data: null, message: 'Discovery section updated successfully'});
        } else {
            const data = await DiscoverySection.create({
                name
            });
            res.status(201).json({data, message: 'Discovery section created successfully'});
        }
        
    } catch(error) {
        const data = validationErrorObj(error.message);
        res.status(500).json({data});
    }
});
router.post('/discovery-section/delete', auth, csrfProtection, async (req, res) => {
    await DiscoverySection.updateOne({
        _id: req.body._id
    }, {
        $set: {
            isDeleted: true
        }
    });
    res.status(201).json({data: null, message: 'Discovery section deleted successfully'});
});

router.get('/sounds/all-section', auth, csrfProtection, async(req, res) => {
    const data = await SoundSection.find({isDeleted: false}).sort({createdAt: -1}).lean();
    res.render(
        'all-section',
        {
            layout: 'main',
            title: 'All Sections',
            data,
            csrfToken: req.csrfToken()
        }
    )
});

router.post('/sounds/all-section', auth, csrfProtection, async (req, res) => {
    const { name, _id } = req.body;
    
    try {
        if(_id) {
            await SoundSection.updateOne({
                _id
            }, {
                $set: {
                    name
                }
            });
            res.status(201).json({data: null, message: 'Section updated successfully'});
        } else {
            const data = await SoundSection.create({
                name
            });
            res.status(201).json({data, message: 'Section created successfully'});
        }
        
    } catch(error) {
        const data = validationErrorObj(error.message);
        res.status(500).json({data});
    }
});

router.post('/sounds/all-section/delete', auth, csrfProtection, async (req, res) => {
    await SoundSection.updateOne({
        _id: req.body._id
    }, {
        $set: {
            isDeleted: true
        }
    });
    res.status(201).json({data: null, message: 'Section deleted successfully'});
});

router.get('/sounds/all-sound', auth, csrfProtection, async(req, res) => {
    const soundDetails = await SoundData.find({isDeleted: false}).populate('soundSection').sort({createdAt: -1}).lean();
    const soundSections = await SoundSection.find({isDeleted: false}).sort({createdAt: -1}).lean();

    const data = [];
    for(const elem of soundDetails) {
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: elem.soundFile,
            Expires: 60 * 5
        };
        const soundUrl = await new Promise((resolve, reject) => {
            s3.getSignedUrl('getObject', params, (err, url) => {
              err ? reject(err) : resolve(url);
            });
        });
        data.push({
            name: elem.name,
            soundSection: elem.soundSection,
            _id: elem._id,
            createdAt: elem.createdAt,
            soundUrl
        });
    }
    res.render(
        'all-sound',
        {
            layout: 'main',
            title: 'All Sounds',
            data,
            soundSections,
            csrfToken: req.csrfToken()
        }
    )
});
router.post('/sounds/all-sound', auth, csrfProtection, uploadSound.single('soundFile'), async (req, res) => {
    const { name, soundSection, _id } = req.body;
    try {
        if (_id) {
            const soundData = await SoundData.findById(_id);
            await SoundData.updateOne({
                _id
            }, {
                $set: {
                    name,
                    soundSection,
                    soundFile: req.file ? req.file.key : soundData.soundFile
                }
            });
            res.status(201).json({message: 'Sound record updated successfully'});
        } else {
            const data = await SoundData.create({
                name,
                soundSection,
                soundFile: req.file.key
            });
            res.status(201).json({data, message: 'Sound record created successfully'});
        }
    } catch (error) {
        const data = validationErrorObj(error.message);
        res.status(500).json({data});
    }
});
router.post('/sounds/all-sound/delete', auth, csrfProtection, async (req, res) => {
    await SoundData.updateOne({
        _id: req.body._id
    }, {
        $set: {
            isDeleted: true
        }
    });
    res.status(201).json({data: null, message: 'Sound deleted successfully'});
});


router.get('/videos', auth, csrfProtection, async (req, res) => {
    const videoDetails = await VideoData
        .find({isDeleted: false})
        .populate('sound')
        .populate('user')
        .populate('discoverySection')
        .sort({createdAt: -1}).lean();
    const discoverySection = await DiscoverySection.find({isDeleted: false}).sort({createdAt: -1}).lean();

    const data = [];
    for(const elem of videoDetails) {
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: elem.videoFile,
            Expires: 60 * 5
        };
        const videoUrl = await new Promise((resolve, reject) => {
            s3.getSignedUrl('getObject', params, (err, url) => {
              err ? reject(err) : resolve(url);
            });
        });
        data.push({
            user: elem.user,
            sound: elem.sound,
            discoverySection: elem.discoverySection,
            _id: elem._id,
            createdAt: elem.createdAt,
            videoUrl
        });
    }
    res.render(
        'all-video',
        {
            layout: 'main',
            title: 'All Videos',
            data,
            discoverySection,
            csrfToken: req.csrfToken()
        }
    );
});

router.post('/videos', auth, csrfProtection, uploadVideo.single('videoFile'), async (req, res) => {
    const { soundId, discoverySection, userId, _id } = req.body;
    try {
        if (_id) {
            const videoData = await VideoData.findById(_id);
            await VideoData.updateOne({
                _id
            }, {
                $set: {
                    sound: soundId,
                    user: userId,
                    discoverySection,
                    videoFile: req.file ? req.file.key : videoData.videoFile
                }
            });
            res.status(201).json({message: 'Video updated successfully'});
        } else {
            const data = await VideoData.create({
                sound: soundId,
                user: userId,
                discoverySection,
                videoFile: req.file.key
            });
            res.status(201).json({data, message: 'Video record created successfully'});
        }
    } catch (error) {
        const data = validationErrorObj(error.message);
        res.status(500).json({data});
    }
});

router.post('/videos/delete', auth, csrfProtection, async (req, res) => {
    await VideoData.updateOne({
        _id: req.body._id
    }, {
        $set: {
            isDeleted: true
        }
    });
    res.status(201).json({data: null, message: 'Video deleted successfully'});
});


router.get('/users/search-by-name', auth, csrfProtection, async (req, res) => {
    const regex = new RegExp(req.query["q"], 'i');
    const query = User.find({username: regex}, { 'username': 1 }).sort({"createdAt":-1}).limit(10).lean();
    query.exec(function(err, users) {
        if (!err) {
           // Method to construct the json result set
           const result = users;
           res.send(result, {
              'Content-Type': 'application/json'
           }, 200);
        } else {
           res.send(JSON.stringify(err), {
              'Content-Type': 'application/json'
           }, 404);
        }
    });
});
router.get('/sounds/search-by-name', auth, csrfProtection, async (req, res) => {
    const regex = new RegExp(req.query["q"], 'i');
    const query = SoundData.find({name: regex}, { 'name': 1 }).sort({"createdAt":-1}).limit(10).lean();
    query.exec(function(err, sounds) {
        if (!err) {
           // Method to construct the json result set
           const result = sounds;
           res.send(result, {
              'Content-Type': 'application/json'
           }, 200);
        } else {
           res.send(JSON.stringify(err), {
              'Content-Type': 'application/json'
           }, 404);
        }
    });
});
// router.get('/signup', async (req, res) => {
//     const data = await Admin.create({
//         email: 'admin@admin.com',
//         password: bCrypt.hashSync('12345678'),
//         firstName: 'Manomit',
//         lastName: 'Mitra',
//         gravatar: gravatar.url('admin@admin.com',{s: '200', r: 'pg', d: '404'}) 
//     });

//     res.send(data);
// });

module.exports = router;