'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fl_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      jobid: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'fl_jobinfos',
          key: 'id'
        },
        primaryKey: true,
        allowNull: false
      },
      stationid: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'fl_stations',
          key: 'id'
        },
        primaryKey: true,
        allowNull: false
      },
      eventtype: {
        type: Sequelize.ENUM('new_learning_round', 'aborted', 'finished'),
        allowNull: false
      },
      round: {
        type: Sequelize.INTEGER,
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
    return queryInterface.dropTable('fl_events');
  }
};