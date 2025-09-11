'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('jobinfos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      jobid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      trainclassid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      traininstanceid: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      route: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      visited: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      trainstoragelocation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currentstation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nextstation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currentstate: {
        type: Sequelize.ENUM('wait_for_pull', 'pulled', 'finished', 'error', 'reject'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      stationmessages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('jobinfos');
  }
};