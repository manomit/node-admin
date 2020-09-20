'use strict';

const   Admin = require('../db/mongo/schemas').adminSchema,
        User = require('../db/mongo/schemas').userSchema,
        DiscoverySection = require('../db/mongo/schemas').discoverSectionSchema,
        SoundSection = require('../db/mongo/schemas').soundSectionSchema,
        SoundData = require('../db/mongo/schemas').soundDataSchema,
        VideoData = require('../db/mongo/schemas').videoDataSchema,
        SoundLanguage = require('../db/mongo/schemas').soundLanguageSchema,
        ProfileVerification = require('../db/mongo/schemas').profileVerification,
        {v4} = require('uuid'),
        { validationErrorObj } = require('../middlewares/validationError'),
        bCrypt = require('bcryptjs'),
        AWS = require('aws-sdk'),
        multer = require('multer'),
        multerS3 = require('multer-s3'),
        { extname } = require('path');

let s3 = null;
let uploadSound = null;
let uploadVideo = null;
let uploadUserData = null;

class Main {
    constructor () {
        s3 = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: process.env.REGION,
            signatureVersion: 'v4'
        });
        
        uploadSound = multer({
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
        }).single('soundFile');

        uploadVideo = multer({
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
        }).single('videoFile');

        uploadUserData = multer({
            storage: multerS3({
                s3,
                bucket: process.env.BUCKET_NAME,
                metadata: function (req, file, cb) {
                    cb(null, {fieldName: file.fieldname});
                },
                key: function (req, file, cb) {
                    const fileExtName = extname(file.originalname);
                    if(file.fieldname === "idCard") {
                        cb(null, `idCard/${Date.now().toString()}${fileExtName}`)
                    }
                    if(file.fieldname === "photo") {
                        cb(null, `photo/${Date.now().toString()}${fileExtName}`)
                    }
                    
                },
                cacheControl: 'max-age=31536000'
            })
        }).fields([{ name: 'idCard', maxCount: 1 },{ name: 'photo', maxCount: 1 }]);
    }

    login(req, res) {
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
    }
    
    loginSubmit(req, res) {
        if(req.user) {
            if (req.body.remember_me) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/users');
        }
    }

    dashBoard(req, res) {
        res.render(
            'dashboard',
            {
                layout: 'main'
            }
        )
    }

    logout(req, res) {
        req.logout();
        res.redirect('/');
    }

    async listUser(req, res) {
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
    }

    async createOrUpdateUser(req, res) {
        const { username, name, device, _id } = req.body;
        try {
            if(_id) {
                await User.updateOne({
                    _id
                }, {
                    $set: {
                        username: username.charAt(0) === "@" ? username: `@${username}`,
                        name,
                        device,
                        updatedBy: req.user._id
                    }
                });
                res.status(201).json({data: null, message: 'User updated successfully'});
            } else {
                const data = await User.create({
                    userId: v4(),
                    username: username.charAt(0) === "@" ? username: `@${username}`,
                    name,
                    device,
                    createdBy: req.user._id
                });
                res.status(201).json({data, message: 'New user created successfully'});
            }
            
        } catch(error) {
            const data = validationErrorObj(error.message);
            res.status(500).json({data});
        }
    }

    async blockUser(req, res) {
        await User.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isBlocked: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'User deleted successfully'});
    }

    async changePasswordGet(req, res) {
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
    }

    async changePasswordPost(req, res) {
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
    }

    async listDiscoverySection(req, res) {
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
    }

    async postDiscoverySection(req, res) {
        const { name, _id } = req.body;
    
        try {
            if(_id) {
                await DiscoverySection.updateOne({
                    _id
                }, {
                    $set: {
                        name,
                        updatedBy: req.user._id
                    }
                });
                res.status(201).json({data: null, message: 'Discovery section updated successfully'});
            } else {
                const data = await DiscoverySection.create({
                    name,
                    createdBy: req.user._id
                });
                res.status(201).json({data, message: 'Discovery section created successfully'});
            }
            
        } catch(error) {
            const data = validationErrorObj(error.message);
            res.status(500).json({data});
        }
    }

    async deleteDiscoverySection(req, res) {
        await DiscoverySection.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isDeleted: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Discovery section deleted successfully'});
    }

    async listSoundSection(req, res) {
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
    }

    async postSoundSection(req, res) {
        const { name, _id } = req.body;
    
        try {
            if(_id) {
                await SoundSection.updateOne({
                    _id
                }, {
                    $set: {
                        name,
                        updatedBy: req.user._id
                    }
                });
                res.status(201).json({data: null, message: 'Section updated successfully'});
            } else {
                const data = await SoundSection.create({
                    name,
                    createdBy: req.user._id
                });
                res.status(201).json({data, message: 'Section created successfully'});
            }
            
        } catch(error) {
            const data = validationErrorObj(error.message);
            res.status(500).json({data});
        }
    }

    async deleteSoundSection(req, res) {
        await SoundSection.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isDeleted: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Section deleted successfully'});
    }

    async listSound(req, res) {
        const soundDetails = await SoundData.find({isDeleted: false}).populate('soundSection').populate('soundLanguage').sort({createdAt: -1}).lean();
        const soundSections = await SoundSection.find({isDeleted: false}).sort({createdAt: -1}).lean();
        const soundLanguages = await SoundLanguage.find({isDeleted: false}).sort({createdAt: -1}).lean();
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
                soundSection: elem.soundSection.map(val => val._id),
                soundLanguage: elem.soundLanguage.map(val => val._id),
                soundSectionName: elem.soundSection.map(val => val.name).join(","),
                soundLanguageName: elem.soundLanguage.map(val => val.name).join(","),
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
                soundLanguages,
                csrfToken: req.csrfToken()
            }
        )
    }

    async postSound(req, res) {
        uploadSound(req, res, async () => {
            const { name, soundSection,soundLanguage, _id } = req.body;
            try {
                if (_id) {
                    const soundData = await SoundData.findById(_id);
                    await SoundData.updateOne({
                        _id
                    }, {
                        $set: {
                            name,
                            soundSection,
                            soundLanguage,
                            soundFile: req.file ? req.file.key : soundData.soundFile,
                            updatedBy: req.user._id
                        }
                    });
                    res.status(201).json({message: 'Sound record updated successfully'});
                } else {
                    const data = await SoundData.create({
                        name,
                        soundSection,
                        soundLanguage,
                        soundFile: req.file.key,
                        createdBy: req.user._id
                    });
                    res.status(201).json({data, message: 'Sound record created successfully'});
                }
            } catch (error) {
                const data = validationErrorObj(error.message);
                res.status(500).json({data});
            }
        });
    }

    async deleteSound(req, res) {
        await SoundData.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isDeleted: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Sound deleted successfully'});
    }

    async listVideo(req, res) {
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
    }

    async postVideo(req, res) {
        uploadVideo(req, res, async () => {
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
                            videoFile: req.file ? req.file.key : videoData.videoFile,
                            updatedBy: req.user._id
                        }
                    });
                    res.status(201).json({message: 'Video updated successfully'});
                } else {
                    const data = await VideoData.create({
                        sound: soundId,
                        user: userId,
                        discoverySection,
                        videoFile: req.file.key,
                        createdBy: req.user._id
                    });
                    res.status(201).json({data, message: 'Video record created successfully'});
                }
            } catch (error) {
                const data = validationErrorObj(error.message);
                res.status(500).json({data});
            }
        });
    }

    async deleteVideo(req, res) {
        await VideoData.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isDeleted: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Video deleted successfully'});
    }

    async searchUserByName(req, res) {
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
    }

    async searchSoundByName(req, res) {
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
    }

    async listLanguage(req, res) {
        const data = await SoundLanguage.find({isDeleted: false}).sort({createdAt: -1}).lean();
        res.render(
            'language',
            {
                layout: 'main',
                title: 'Language',
                data,
                csrfToken: req.csrfToken()
            }
        )
    }

    async postLanguage(req, res) {
        const { name, code, _id } = req.body;
    
        try {
            if(_id) {
                await SoundLanguage.updateOne({
                    _id
                }, {
                    $set: {
                        name,
                        code,
                        updatedBy: req.user._id
                    }
                });
                res.status(201).json({data: null, message: 'Language updated successfully'});
            } else {
                const data = await SoundLanguage.create({
                    name,
                    code,
                    createdBy: req.user._id
                });
                res.status(201).json({data, message: 'Language created successfully'});
            }
            
        } catch(error) {
            const data = validationErrorObj(error.message);
            res.status(500).json({data});
        }
    }

    async deleteLanguage(req, res) {
        await SoundLanguage.updateOne({
            _id: req.body._id
        }, {
            $set: {
                isDeleted: true,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Language deleted successfully'});
    }

    async listAdmin(req, res) {
        const data = await Admin.find({_id: {$ne: req.user._id}}).sort({createdAt: 1}).lean();
        res.render(
            'admins',
            {
                layout: 'main',
                title: 'All Admins',
                data,
                csrfToken: req.csrfToken()
            }
        )
    }

    async createOrUpdateAdmin(req, res) {
        const { email, password, firstName, lastName, adminType, _id } = req.body;
        const messageType = adminType === "SUPER_ADMIN" ? "Super admin": "Admin";
        try {
            if(_id) {
                await Admin.updateOne({
                    _id
                }, {
                    $set: {
                        firstName,
                        lastName,
                        adminType,
                        updatedBy: req.user._id
                    }
                });
                res.status(201).json({data: null, message: `${messageType} updated successfully`});
            } else {
                const data = await Admin.create({
                    firstName,
                    lastName,
                    email,
                    password: bCrypt.hashSync(password),
                    adminType,
                    createdBy: req.user._id
                });
                res.status(201).json({data, message: `${messageType} created successfully`});
            }
            
        } catch(error) {
            const data = validationErrorObj(error.message);
            res.status(500).json({data});
        }
    }

    async getUserProfileVerification(req, res) {
        const userDetails = await User.find({}).sort({createdAt: 1}).lean();
        const data = [];
        for(const elem of userDetails) {

            const profileDetails = await ProfileVerification.find({user: elem._id});
            let photoUrl = "";
            let cardUrl = "";
            let _id = "";
            if(profileDetails.length > 0) {
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: profileDetails[0].photo,
                    Expires: 60 * 5
                };
                photoUrl = await new Promise((resolve, reject) => {
                    s3.getSignedUrl('getObject', params, (err, url) => {
                    err ? reject(err) : resolve(url);
                    });
                });
    
                const params2 = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: profileDetails[0].idCard,
                    Expires: 60 * 5
                };
                cardUrl = await new Promise((resolve, reject) => {
                    s3.getSignedUrl('getObject', params2, (err, url) => {
                    err ? reject(err) : resolve(url);
                    });
                });
                _id = profileDetails[0]._id;
            }
            
            data.push({
                _id,
                userId: elem._id,
                username: elem.username,
                createdAt: profileDetails.length > 0 ? profileDetails[0].createdAt: null,
                photoUrl,
                cardUrl,
                status: profileDetails.length > 0 ? profileDetails[0].status: "",
            });
        }
        res.render(
            'profile-verification',
            {
                layout: 'main',
                title: 'Profile Verification',
                data,
                csrfToken: req.csrfToken()
            }
        )
    }

    async uploadProfileData(req, res) {
        uploadUserData(req, res, async () => {
            const { userId,_id } = req.body;
            try {
                if (_id) {
                    const profileData = await ProfileVerification.findById(_id);
                    await ProfileVerification.updateOne({
                        _id
                    }, {
                        $set: {
                            user: userId,
                            photo: req.files.photo ? req.files.photo[0].key : profileData.photo,
                            idCard: req.files.idCard ? req.files.idCard[0].key : profileData.idCard,
                            updatedBy: req.user._id
                        }
                    });
                    res.status(201).json({message: 'Profile data updated successfully'});
                } else {

                    const data = await ProfileVerification.create({
                        photo: req.files.photo[0].key,
                        user: userId,
                        idCard: req.files.idCard[0].key,
                        createdBy: req.user._id
                    });
                    res.status(201).json({data, message: 'Profile data created successfully'});
                }
            } catch (error) {
                const data = validationErrorObj(error.message);
                res.status(500).json({data});
            }
        });
    }

    async profileDataStatusChange(req, res) {
        await ProfileVerification.updateOne({
            _id: req.body._id
        }, {
            $set: {
                status: req.body.status,
                updatedBy: req.user._id
            }
        });
        res.status(201).json({data: null, message: 'Profile data status changed successfully'});
    }

    // async adminSignup(req, res) {
    //     const data = await Admin.create({
    //         email: 'admin@admin.com',
    //         password: bCrypt.hashSync('12345678'),
    //         firstName: 'Manomit',
    //         lastName: 'Mitra',
    //         gravatar: gravatar.url('admin@admin.com',{s: '200', r: 'pg', d: '404'}),
    //         adminType: "SUPER_ADMIN",
    //         createdBy: null 
    //     });
            
    //     res.send(data);
    // }
}

module.exports = Main;