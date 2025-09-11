module.exports = {
    development: {
      //If you want to use the center_database instead of the one create for your system user, 
      //Replace the environment variables below
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres',
      host: process.env.DB_HOST,
      dialect: 'postgres',
    },
    test: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres',
      host: process.env.DB_HOST,
      dialect: 'postgres',
    },
    production: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres',
      host: process.env.DB_HOST,
      dialect: 'postgres',
    },
  };