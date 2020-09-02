'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let db;
/*****************************************
 *    CONNECTING MONGODB USING MONGOOSE  *
 *****************************************/
const connect = (address, options) => {
  db = mongoose.connect(address, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    keepAlive: true,
  });
  return new Promise((resolve, reject) => {
    mongoose.connection.once('open', () => {
      require('./schemas');
      console.log('Database Connected : ', mongoose.connection.port);
      resolve();
    });
    mongoose.connection.on('error', err => {
      if (err) {
        throw new Error('Database Connection Error ', err);
        //reject();
      }
    });
  });
};

module.exports.connect = connect;
/**************************************
 *  RETURNS MONGOOSE INSTANCE         *
 **************************************/

module.exports.dbInstance = () => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }
  return db;
};
