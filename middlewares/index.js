'use strict';
const expHbs = require('express-handlebars'),
      bodyParser = require('body-parser'),
      session = require('express-session'),
      cookieParser = require('cookie-parser'),
      // redis = require('redis'),
      // redisStore = require('connect-redis')(session),
      flash = require('connect-flash'),
      cors = require('cors'),
      compression = require('compression'),
      logger = require('morgan'),
      AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION
});
// const client = redis.createClient();
const hbs = expHbs.create({
    extname: '.hbs',
    helpers: {
        if_eq: function (a, b, opts) {
            if (a === b)
                return opts.fn(this);
            else
                return opts.inverse(this);
        },
        math: function (lvalue, operator, rvalue) {
            lvalue = parseFloat(lvalue);
            rvalue = parseFloat(rvalue);
            return {
                "+": lvalue + rvalue,
                "-": lvalue - rvalue,
                "*": lvalue * rvalue,
                "/": lvalue / rvalue,
                "%": lvalue % rvalue
            } [operator];
        },
        getSignedSoundFile: async function(value) {
            const params = {
                Bucket: process.env.BUCKET_NAME,
                Key: value,
                Expires: 60 * 5
            };
            const url = await new Promise((resolve, reject) => {
                s3.getSignedUrl('getObject', params, (err, url) => {
                  err ? reject(err) : resolve(url);
                });
            });
            return url;
        },
        dateFormat: require('handlebars-dateformat')
    }
});

module.exports = (app, passport) => {
    app.engine('.hbs', hbs.engine);
    app.set('view engine', 'hbs');
    app
    .use(cors())
    .use(compression())
    .use(logger('dev'))
    .use(bodyParser.urlencoded({extended: true}))
    .use(bodyParser.json())
    .use(session({
        // store: new redisStore({
        //     host: process.env.REDIS_HOST,
        //     port: process.env.REDIS_PORT,
        //     client
        // }),
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: true,
        cookie: {
            path: '/'
        },
        name: '_id',
        ttl: (1 * 60 * 60)
    }))
    .use(cookieParser())
    .use(passport.initialize())
    .use(passport.session())
    .use(flash())
    return app;
};