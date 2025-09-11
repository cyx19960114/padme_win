import { useState, useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import Container from "@mui/material/Container";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Skeleton from "@mui/material/Skeleton";
import DownloadIcon from "@mui/icons-material/CloudDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NotesIcon from "@mui/icons-material/Notes";
import RefreshIcon from "@mui/icons-material/Refresh";

import TableHead from "./TableHead";
import TableToolbar from "./TableToolbar";
import TablePaginationActions from "./TablePaginationActions";
import { stableSort, getComparator, renderStationID } from "../utils";
import {
  columnLabel,
  columns,
  columnsFL,
  learningType,
  trainStates,
} from "../constants";
import {
  fetchJobs,
  fetchTrains,
  fetchStations,
  fetchJobResult,
  selectAllJobs,
  setRejectModal,
  getTableRows,
  getOpenRejectModal,
  getLearningType,
  resetResultTab,
  isLoading,
  requestTrain,
} from "../trainsSlice";
import { resetLogs } from "../aggregationLogSlice";
import TrainRouteModal from "../../../components/train-route-modal";
import JobResultModal from "../../../components/job-result-modal";
import TrainRejectModal from "../../../components/train-reject-modal";
import FederatedTrainRouteModal from "../../../components/federated-train-route-modal";
import AggregationLogsModal from "../../../components/aggregation-logs-modal";

const RequesterTable = () => {
  const dispatch = useDispatch();

  const jobs = useSelector(selectAllJobs);
  const rows = useSelector(getTableRows);
  const loading = useSelector(isLoading);
  const openRejectModal = useSelector(getOpenRejectModal);
  const learning = useSelector(getLearningType);
  const isIncremental = learning === learningType.INCREMENTAL;

  useEffect(() => {
    dispatch(fetchStations());
    dispatch(fetchTrains());
    dispatch(fetchJobs());
  }, [dispatch, learning]);

  const [rowSelected, setRowSelected] = useState(jobs[0]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState(columnLabel.LAST_UPDATE.key);
  const [openRoute, setOpenRoute] = useState(false);
  const [openFederatedRoute, setOpenFederatedRoute] = useState(false);
  const [openResult, setOpenResult] = useState(false);
  const [openAggregationLogs, setOpenAggregationLogs] = useState(false);

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderTrainRoute = (row) => {
    const handleRouteDetails = () => {
      setRowSelected(row);
      setOpenRoute(true);
    };

    return (
      <Tooltip title="Show details">
        <IconButton
          size="large"
          aria-label="show details"
          onClick={handleRouteDetails}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    );
  };

  const renderFederatedTrainRoute = (row) => {
    const handleRouteDetails = () => {
      setRowSelected(row);
      setOpenFederatedRoute(true);
    };

    return (
      <Tooltip title="Show details">
        <IconButton
          size="large"
          aria-label="show details"
          onClick={handleRouteDetails}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    );
  };

  const renderCurrentStatus = (row) => {
    const label = row.currentStatus.replace(/_/g, " ");
    let props = {
      sx: { width: 100, fontWeight: "bold" },
      color: "default",
    };

    switch (row.currentStatus) {
      case trainStates.ERROR:
        props.color = "error";
        break;
      case trainStates.REJECTED:
        props.color = "warning";
        break;
      case trainStates.REJECT:
        props.color = "warning";
        props.icon = <SwipeLeftIcon />;
        props.onClick = () => {
          setRowSelected(row);
          dispatch(setRejectModal(true));
        };
        break;
      case trainStates.PULLED:
      case trainStates.RUNNING:
      case trainStates.AGGREGATING:
        props.color = "info";
        break;
      case trainStates.FINISHED:
        props.color = "success";
        break;
      default:
        break;
    }

    return row.currentStatus === trainStates.WAIT_FOR_ACCEPTANCE ? (
      <Tooltip title={label} disableInteractive>
        <Chip {...props} label={label} />
      </Tooltip>
    ) : (
      <Chip {...props} label={label} />
    );
  };

  const renderSkeletonRows = Array(rowsPerPage)
    .fill("")
    .map((_, ridx) => (
      <TableRow hover key={`skeleton-row-${ridx}`}>
        {/* Should be equal to no. of columns */}
        {Array(isIncremental ? columns.length : columnsFL.length)
          .fill("")
          .map((__, cidx) => (
            <TableCell key={`skeleton-col-${cidx}-${ridx}`}>
              <Skeleton variant="text" height={30} />
            </TableCell>
          ))}
      </TableRow>
    ));

  const renderEmptyRow = (
    <TableRow>
      <TableCell
        colSpan={isIncremental ? columns.length : columnsFL.length}
        align="center"
      >
        No data available in table for <b>{learning}</b> learning
      </TableCell>
    </TableRow>
  );

  const handleDownload = (row, handleClose) => {
    setRowSelected(row);
    dispatch(resetResultTab());
    dispatch(fetchJobResult(row.jobID));
    setOpenResult(true);

    handleClose();
  };

  const handleReRun = (row, popupClose) => {
    let payload;
    if (isIncremental) {
      payload = {
        route: row.route.join(","),
        trainclassid: row.trainClass,
        traininstanceid: 1,
      };
    } else {
      payload = {
        rounds: row.maxRounds,
        stations: row.stations.map((st) => st.uid),
        trainclassAggregation: row.trainClassIdAggregation,
        trainclassLearning: row.trainClassIdLearning,
      };
    }

    if (window.confirm("Are you sure you want to re-run this job?")) {
      dispatch(requestTrain(payload));
    }

    popupClose();
  };

  const handleAggregationLogs = (row, popupClose) => {
    setRowSelected(row);
    dispatch(resetLogs());
    setOpenAggregationLogs(true);

    popupClose();
  };

  const menuItems = (row, popupClose) => [
    {
      label:
        row.currentStatus === trainStates.FINISHED
          ? "Download results"
          : "Results unavailable",
      color: "text.primary",
      icon: <DownloadIcon />,
      disabled: row.currentStatus !== trainStates.FINISHED,
      show: true,
      onClick: () => handleDownload(row, popupClose),
    },
    {
      label: "Re-run job",
      color: "text.primary",
      icon: <RefreshIcon />,
      show: true,
      onClick: () => handleReRun(row, popupClose),
    },
    {
      label: "Aggregation Logs",
      color: "text.primary",
      icon: <NotesIcon />,
      show: !isIncremental,
      onClick: () => handleAggregationLogs(row, popupClose),
    },
  ];

  const renderTableRows = loading
    ? renderSkeletonRows
    : rows.length === 0
    ? renderEmptyRow
    : stableSort(rows, getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) => (
          <TableRow hover key={row.jobID}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.jobID}</TableCell>
            {isIncremental ? (
              <Fragment>
                <TableCell>{row.trainClass}</TableCell>
                <TableCell>{renderStationID(row.currentStation)}</TableCell>
                <TableCell>{renderStationID(row.nextStation)}</TableCell>
                <TableCell>{renderCurrentStatus(row)}</TableCell>
                <TableCell>{renderTrainRoute(row)}</TableCell>
              </Fragment>
            ) : (
              <Fragment>
                <TableCell>
                  {row.trainClassIdLearning} <br />
                  {row.trainClassIdAggregation}
                </TableCell>
                <TableCell>
                  {row.currentRound}/{row.maxRounds}
                </TableCell>
                <TableCell>{renderCurrentStatus(row)}</TableCell>
                <TableCell>{renderFederatedTrainRoute(row)}</TableCell>
              </Fragment>
            )}
            <TableCell>
              {new Date(row.lastUpdate).toLocaleString("de-DE")}
            </TableCell>
            <TableCell>
              <PopupState
                key={`popup-${row.jobID}`}
                variant="popover"
                popupId="train-popup-menu"
              >
                {(popupState) => (
                  <Fragment>
                    <IconButton {...bindTrigger(popupState)}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu {...bindMenu(popupState)}>
                      {menuItems(row, popupState.close).map(
                        (item) =>
                          item.show && (
                            <MenuItem
                              key={`${row?.id}-${item.label}`}
                              disabled={item.disabled}
                              onClick={item.onClick}
                            >
                              <ListItemIcon>{item.icon}</ListItemIcon>
                              <Typography color={item.color}>
                                {item.label}
                              </Typography>
                            </MenuItem>
                          )
                      )}
                    </Menu>
                  </Fragment>
                )}
              </PopupState>
            </TableCell>
          </TableRow>
        ));

  return (
    <Container sx={{ my: 5 }} maxWidth="xl">
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableToolbar
          rows={jobs}
          setPage={setPage}
          isIncremental={isIncremental}
        />
        <TableContainer sx={{ maxHeight: 900 }}>
          <Table
            stickyHeader
            aria-label="Requested Trains"
            sx={{ minWidth: 650, tableLayout: "auto" }}
          >
            <TableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>{renderTableRows}</TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50, { label: "All", value: -1 }]}
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          sx={{ "& .MuiToolbar-root": { pr: 2 } }}
          SelectProps={{
            inputProps: {
              "aria-label": "rows per page",
            },
            native: true,
          }}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={TablePaginationActions}
        />
      </Paper>
      <TrainRouteModal
        open={openRoute}
        handleClose={() => setOpenRoute(false)}
        selected={rowSelected}
      />
      <FederatedTrainRouteModal
        open={openFederatedRoute}
        handleClose={() => setOpenFederatedRoute(false)}
        selected={rowSelected}
      />
      <TrainRejectModal
        open={openRejectModal}
        handleClose={() => dispatch(setRejectModal(false))}
        selected={rowSelected}
      />
      <JobResultModal
        open={openResult}
        handleClose={() => setOpenResult(false)}
        selected={rowSelected}
      />
      <AggregationLogsModal
        open={openAggregationLogs}
        handleClose={() => setOpenAggregationLogs(false)}
        selected={rowSelected}
      />
    </Container>
  );
};

export default RequesterTable;
