const learningType = {
  INCREMENTAL: "incremental",
  FEDERATED: "federated",
};

const trainStates = {
  WAIT_FOR_PULL: "wait_for_pull",
  WAIT_FOR_ACCEPTANCE: "wait_for_acceptance",
  FINISHED: "finished",
  PULLED: "pulled",
  REJECT: "reject",
  REJECTED: "rejected",
  RUNNING: "running",
  AGGREGATING: "aggregating",
  ERROR: "error",
};

const colors = {
  WAIT_FOR_PULL: "#bdbdbd",
  WAIT_FOR_ACCEPTANCE: "#bdbdbd",
  FINISHED: "#28a745",
  PULLED: "#3B86CB",
  RUNNING: "#3B86CB",
  AGGREGATING: "#3B86CB",
  REJECT: "#ed6c02",
  REJECTED: "#ed6c02",
  ERROR: "#d32f2f",
};

const resultTab = {
  LIST: "result-tab-0",
  VIEW: "result-tab-1",
};

const fileView = {
  TABLE: "table",
  CHART: "chart",
};

const plotTypes = {
  SCATTER: "scatter",
  LINE: "line",
  BAR: "bar",
};

const resultItemSupportedTypes = {
  IMAGE: "image",
  TEXT: "text",
  CSV: "csv",
};

const filter = {
  ALL: {
    key: "all",
    group: Object.values(trainStates),
  },
  FINISHED: {
    key: "finished",
    group: [trainStates.FINISHED],
  },
  RUNNING: {
    key: "running",
    group: [
      trainStates.RUNNING,
      trainStates.WAIT_FOR_PULL,
      trainStates.WAIT_FOR_ACCEPTANCE,
      trainStates.PULLED,
    ],
  },
};

const columnLabel = {
  ID: {
    key: "id",
    label: "ID",
  },
  JOB_ID: {
    key: "jobID",
    label: "Job ID",
  },
  TRAIN_CLASS: {
    key: "trainClass",
    label: "Train Class",
  },
  TRAIN_CLASSES: {
    key: "trainClasses",
    label: "Train Classes",
  },
  ROUNDS: {
    key: "rounds",
    label: "Rounds",
  },
  CURRENT_STATION: {
    key: "currentStation",
    label: "Curr. Station",
  },
  STATIONS: {
    key: "stations",
    label: "Stations",
  },
  NEXT_STATION: {
    key: "nextStation",
    label: "Next Station",
  },
  CURRENT_STATUS: {
    key: "currentStatus",
    label: "Curr. Status",
  },
  ROUTE: {
    key: "route",
    label: "Route",
  },
  LAST_UPDATE: {
    key: "lastUpdate",
    label: "Last Update",
  },
  RESULTS: {
    key: "results",
    label: "Results",
  },
  AGGREGATION_LOGS: {
    key: "aggregationLogs",
    label: "Aggregation Logs",
  },
  RERUN: {
    key: "reRun",
    label: "Re-run",
  },
  OPERATION: { key: "operation", label: "Operation" },
};

const columns = [
  {
    id: columnLabel.ID.key,
    numeric: true,
    align: "left",
    label: columnLabel.ID.label,
  },
  {
    id: columnLabel.JOB_ID.key,
    numeric: false,
    align: "left",
    label: columnLabel.JOB_ID.label,
  },
  {
    id: columnLabel.TRAIN_CLASS.key,
    numeric: false,
    align: "left",
    label: columnLabel.TRAIN_CLASS.label,
  },
  {
    id: columnLabel.CURRENT_STATION.key,
    numeric: false,
    align: "left",
    label: columnLabel.CURRENT_STATION.label,
  },
  {
    id: columnLabel.NEXT_STATION.key,
    numeric: false,
    align: "left",
    label: columnLabel.NEXT_STATION.label,
  },
  {
    id: columnLabel.CURRENT_STATUS.key,
    numeric: false,
    align: "center",
    label: columnLabel.CURRENT_STATUS.label,
  },
  {
    id: columnLabel.ROUTE.key,
    numeric: false,
    align: "center",
    label: columnLabel.ROUTE.label,
  },
  {
    id: columnLabel.LAST_UPDATE.key,
    numeric: false,
    align: "left",
    label: columnLabel.LAST_UPDATE.label,
  },
  {
    id: columnLabel.OPERATION.key,
    align: "center",
    label: columnLabel.OPERATION.label,
  },
];

const columnsFL = [
  {
    id: columnLabel.ID.key,
    numeric: true,
    align: "left",
    label: columnLabel.ID.label,
  },
  {
    id: columnLabel.JOB_ID.key,
    numeric: false,
    align: "left",
    label: columnLabel.JOB_ID.label,
  },
  {
    id: columnLabel.TRAIN_CLASSES.key,
    numeric: false,
    align: "left",
    label: columnLabel.TRAIN_CLASSES.label,
  },
  {
    id: columnLabel.ROUNDS.key,
    numeric: false,
    align: "center",
    label: columnLabel.ROUNDS.label,
  },
  {
    id: columnLabel.CURRENT_STATUS.key,
    numeric: false,
    align: "center",
    label: columnLabel.CURRENT_STATUS.label,
  },
  {
    id: columnLabel.STATIONS.key,
    numeric: false,
    align: "center",
    label: columnLabel.STATIONS.label,
  },
  {
    id: columnLabel.LAST_UPDATE.key,
    numeric: false,
    align: "left",
    label: columnLabel.LAST_UPDATE.label,
  },
  {
    id: columnLabel.OPERATION.key,
    align: "center",
    label: columnLabel.OPERATION.label,
  },
];

export {
  trainStates,
  filter,
  columns,
  columnsFL,
  columnLabel,
  colors,
  resultTab,
  resultItemSupportedTypes,
  fileView,
  plotTypes,
  learningType,
};
