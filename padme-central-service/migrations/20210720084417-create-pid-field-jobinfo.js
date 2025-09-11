'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('jobinfos', 'pid', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('jobinfos', 'pid')
  }
};
