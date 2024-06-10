"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

// if (process.env.NODE_ENV === "production") {
//   db = new Client({
//     connectionString: getDatabaseUri(),
//     ssl: {
//       rejectUnauthorized: false
//     }
//   });
// } else {
//   db = new Client({
//     connectionString: getDatabaseUri()
//   });
// }

/* 
  Changed setup to work with Express 4.17.1
  change user and password to the credentials for postgresql when run locally
  the port is not the port for accessing the api, and is instead for connecting
  to psql
*/

if (process.env.NODE_ENV === "production") {
  db = new Client({
    user: 'client',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    user: 'client',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: getDatabaseUri()
  });
}

db.connect();

module.exports = db;