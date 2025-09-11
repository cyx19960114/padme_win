'use strict';
module.exports = (sequelize, DataTypes) => {
  const StationListCache = sequelize.define('StationListCache', {
    key: DataTypes.STRING,
    value: DataTypes.JSON
  }, {});
  StationListCache.associate = function(models) {
    // associations can be defined here
  };
  return StationListCache;
};