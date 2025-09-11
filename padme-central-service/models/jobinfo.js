'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobinfo = sequelize.define('jobinfo', {
    jobid: { type:DataTypes.STRING, allowNull: false},
    // PID of the instantiated train, used for Metadata and to identify the instance outside of out architecture
    pid: { type:DataTypes.STRING, allowNull: false},
    userid: { type:DataTypes.STRING, allowNull: false},
    trainclassid: { type:DataTypes.STRING, allowNull: false},
    traininstanceid:{ type:DataTypes.INTEGER, allowNull: false},
    route: {type:DataTypes.ARRAY(DataTypes.STRING), allowNull: false},
    visited: {type:DataTypes.ARRAY(DataTypes.STRING), allowNull: false},
    trainstoragelocation: {type:DataTypes.STRING, allowNull: false},
    currentstation:{ type:DataTypes.STRING, allowNull: false},
    nextstation:{type:DataTypes.STRING, allowNull: false},
    currentstate:{ type:DataTypes.ENUM('wait_for_pull', 'pulled', 'finished', 'error','reject'), allowNull: false},
    stationmessages: {type:DataTypes.ARRAY(DataTypes.STRING), allowNull: false},
  }, {});
  jobinfo.associate = function(models) {
    // associations can be defined here
  };
  return jobinfo;
};