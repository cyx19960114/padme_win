'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fl_jobinfos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      jobid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      pid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      trainclassidlearning: {
        type: Sequelize.STRING,
        allowNull: false
      },
      learningstoragelocation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      trainclassidaggregation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resultstoragelocation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currentround: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      maxrounds: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      currentstate: {
        type: Sequelize.ENUM('wait_for_acceptance', 'running', 'aggregating', 'rejected', 'finished', 'error'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('fl_jobinfos');
  }
};