'use strict';
module.exports = (sequelize, DataTypes) => {
  const fl_jobinfo = sequelize.define('fl_jobinfo', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    jobid: { type: DataTypes.STRING, allowNull: false},
    // PID of the instantiated train, used for Metadata and to identify the instance outside of out architecture
    pid: { type: DataTypes.STRING, allowNull: false},
    userid: { type: DataTypes.STRING, allowNull: false},
    trainclassidlearning: { type: DataTypes.STRING, allowNull: false },
    learningstoragelocation: { type: DataTypes.STRING, allowNull: false},
    trainclassidaggregation: { type: DataTypes.STRING, allowNull: false},
    resultstoragelocation: { type: DataTypes.STRING, allowNull: false, defaultValue: ""},
    currentround: { type: DataTypes.INTEGER, allowNull: false},
    maxrounds: { type: DataTypes.INTEGER, allowNull: false},
    currentstate: {type: DataTypes.ENUM('wait_for_acceptance', 'running', 'aggregating', 'rejected', 'finished', 'error'), allowNull: false }
  }, {});
  fl_jobinfo.associate = function(models) {
    // associations can be defined here
    fl_jobinfo.hasMany(models.fl_station,
    {
      foreignKey: 'jobid',
      as: 'Stations'
    });
    
    fl_jobinfo.hasMany(models.fl_event,
    {
      foreignKey: 'jobid',
      as: 'Events'
    });
  };
  return fl_jobinfo;
};