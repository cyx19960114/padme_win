'use strict';
module.exports = (sequelize, DataTypes) => {
  const AggregationLog = sequelize.define('AggregationLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    jobid: { type: DataTypes.STRING, allowNull: false },
    log: DataTypes.TEXT
  }, {
    timestamps: true,
    updatedAt: false
  });
  AggregationLog.associate = function (models) {
    // associations can be defined here
  };
  return AggregationLog;
};