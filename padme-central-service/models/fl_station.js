'use strict';
module.exports = (sequelize, DataTypes) => {
  const fl_station = sequelize.define('fl_station', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false},
    jobid: { type: DataTypes.INTEGER, allowNull: false },
    uid: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false, defaultValue: "No Message from Station" },
    doneWithCurrentState: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null },
    failedCurrentRound: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null }
  }, {});
  fl_station.associate = function(models) {
    // associations can be defined here
    fl_station.hasMany(models.fl_event,
    {
      foreignKey: 'stationid',
      as: 'Events'
    });
    fl_station.belongsTo(models.fl_jobinfo,
    {
      foreignKey: 'id',
      as: 'Job'
    });
  };
  return fl_station;
};