require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'job_portal',
    },
    migrations: {
      directory: './migrations',
    },
    // You can add seeds directory if needed
    // seeds: {
    //   directory: './seeds'
    // },
  },

  // Add production or test configs here if needed
};
