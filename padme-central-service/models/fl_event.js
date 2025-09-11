'use strict';
module.exports = (sequelize, DataTypes) => {
  const fl_event = sequelize.define('fl_event', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    jobid: { type: DataTypes.INTEGER, allowNull: false },
    stationid: { type: DataTypes.INTEGER, allowNull: false },
    eventtype: { type: DataTypes.ENUM('new_learning_round', 'aborted', 'finished'), allowNull: false},
    round: { type: DataTypes.INTEGER, allowNull: false },
  }, {});
  fl_event.associate = function(models) {
    // associations can be defined here
    fl_event.belongsTo(models.fl_station,
    {
      foreignKey: 'id',
      as: 'Station'
    });
    fl_event.belongsTo(models.fl_jobinfo,
    {
      foreignKey: 'id',
      as: 'Job'
    });
  };
  return fl_event;
};