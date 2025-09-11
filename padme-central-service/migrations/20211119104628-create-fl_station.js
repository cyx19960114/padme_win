'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('fl_stations', {
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
        allowNull: false
      },
      uid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false
      },
      doneWithCurrentState: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      failedCurrentRound: {
        type: Sequelize.BOOLEAN,
        allowNull: true
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
    return queryInterface.dropTable('fl_stations');
  }
};