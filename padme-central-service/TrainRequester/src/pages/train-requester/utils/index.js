import store from "../../../redux/store";

const createData = (
  id,
  jobID,
  trainClass,
  currentStation,
  nextStation,
  currentStatus,
  route,
  lastUpdate,
  stationMessage,
  visited
) => ({
  id,
  jobID,
  trainClass,
  currentStation,
  nextStation,
  currentStatus,
  route,
  lastUpdate,
  stationMessage,
  visited,
});

const createDataFL = (
  id,
  jobID,
  trainClassIdLearning,
  trainClassIdAggregation,
  currentRound,
  maxRounds,
  currentStatus,
  stations,
  lastUpdate
) => ({
  id,
  jobID,
  trainClassIdLearning,
  trainClassIdAggregation,
  currentRound,
  maxRounds,
  currentStatus,
  stations,
  lastUpdate,
});

const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
};

const getComparator = (order, orderBy) => {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

/**
 * Search for all stations with a substring.
 * Filter stations IDs if found else return param.
 */
const renderStationName = (stationName) => {
  const state = store.getState().trains;
  const stationsFiltered = state.stations.filter((st) =>
    st.name.toLowerCase().includes(stationName)
  );
  return stationsFiltered.length ? stationsFiltered.map((st) => st.id) : "";
};

const getStationId = (stationName) => {
  const state = store.getState().trains;
  return state.stations.find((st) => st.name === stationName)?.id;
};

/**
 * Return station name for a corresponding station ID
 */
const renderStationID = (currentStation) => {
  if (currentStation === "-1") return "-";
  const state = store.getState().trains;
  const station = state.stations.find((st) => st.id === currentStation);
  return station ? station.name : currentStation;
};

const groupStations = () => {
  const state = store.getState().trains;
  return state.stations.reduce((grouped, station) => {
    const title = `${station.organization.name} (${station.stationType.name})`;
    grouped[title] = grouped[title] || [];
    grouped[title].push({
      id: station.id,
      name: station.name,
      status: station["onboarding-status"],
    });
    return grouped;
  }, {});
};

const getStations = () => {
  const state = store.getState().trains;
  const stations = state.stations.map((station) => {
    return {
      id: station.id,
      name: station.name,
      status: station["onboarding-status"],
      organization: station.organization.name,
    }
  });
  return stations.sort((a, b) => a.organization.localeCompare(b.organization));
};

export {
  createData,
  createDataFL,
  renderStationName,
  renderStationID,
  getComparator,
  stableSort,
  groupStations,
  getStationId,
  getStations,
};
