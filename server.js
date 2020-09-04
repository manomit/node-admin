
require('dotenv').config();
const cluster = require('cluster'),
      http = require('http'),  
      db = require('./db'),
      express = require('express'),
      passport = require('passport');

var handlebars = require('handlebars'),
      layouts = require('handlebars-layouts');
handlebars.registerHelper(layouts(handlebars));
      
const app = express();
require('./config/passport')(passport);

// if(cluster.isMaster) {
//     const cpuCount = require('os').cpus().length;

//     for(let i = 0; i < cpuCount; i++) {
//         cluster.fork();
//     }
//     cluster.on('exit', worker => {
//         console.log(`Worker ${worker.id} died :(`);
//         cluster.fork();
//     })
// } else {
    db
    .connect(`${process.env.DB_HOST}`)
    .then(() => require('./middlewares')(app, passport))
    .then(() => require('./routes')(app))
    .then(() => {
        http
            .createServer(app)
            .listen((process.env.PORT || 9000), () => {
                console.log(`Server is running on ${process.env.PORT}`)
            })
    })
// }