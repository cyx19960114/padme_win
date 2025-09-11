import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import TreeView from "@mui/lab/TreeView";
import TreeItem, { treeItemClasses } from "@mui/lab/TreeItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import FolderIcon from "@mui/icons-material/Folder";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorIcon from "@mui/icons-material/ErrorOutline";

import {
  getDownloadFiles,
  setDownloadFiles,
  selectJobResult,
  getSelectedFile,
  getResultItem,
  downloadResultItem,
  setOpenTab,
  getOpenTab,
  isLoadingResults
} from "../../pages/train-requester/trainsSlice";
import { resultItemSupportedTypes } from "../../pages/train-requester/constants";
import CsvFile from "../CsvFile";

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-expanded": {
      fontWeight: theme.typography.fontWeightRegular,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: "var(--tree-view-color)",
    },
    "& .MuiCheckbox-root": { padding: 3 },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  },
}));

const StyledTreeItem = (props) => {
  const {
    bgColor,
    color,
    jobId,
    labelIcon: LabelIcon,
    iconColor = "orange",
    labelInfo,
    labelText,
    ...other
  } = props;

  const dispatch = useDispatch();
  const files = useSelector(getDownloadFiles);
  const [checked, setChecked] = React.useState(false);

  const handleChange =
    (filepath) =>
    ({ target }) => {
      setChecked(target.checked);

      if (target.checked) {
        dispatch(setDownloadFiles([...files, filepath]));
      } else {
        dispatch(setDownloadFiles(files.filter((path) => path !== filepath)));
      }
    };

  const handleViewFile = () => {
    dispatch(downloadResultItem({ jobId, file: props.nodeId }));
  };

  return (
    <StyledTreeItemRoot
      label={
        <Box sx={{ display: "flex", alignItems: "center", p: 0.5, pr: 0 }}>
          <Box component={LabelIcon} color={iconColor} sx={{ mr: 1 }} />
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: 600, flexGrow: 1 }}
            onClick={!props.children ? handleViewFile : null}
          >
            {labelText}
          </Typography>
          <Typography variant="caption" color="inherit">
            {labelInfo}
          </Typography>
          {!props.children && (
            <Checkbox
              checked={checked}
              size="small"
              onChange={handleChange(props.nodeId)}
              inputProps={{ "aria-label": "controlled" }}
            />
          )}
        </Box>
      }
      style={{
        "--tree-view-color": color,
        "--tree-view-bg-color": bgColor,
      }}
      {...other}
    />
  );
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`result-tabpanel-${index}`}
      aria-labelledby={`result-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `result-tab-${index}`,
    "aria-controls": `result-tabpanel-${index}`,
  };
}

const ResultTree = ({ jobId }) => {
  const dispatch = useDispatch();
  const results = useSelector(selectJobResult);
  const loading = useSelector(isLoadingResults);
  const selectedFile = useSelector(getSelectedFile);
  const resultItem = useSelector(getResultItem);
  const openTab = useSelector(getOpenTab);

  const handleChangeTab = (event, newValue) => {
    dispatch(
      setOpenTab({
        tab: newValue,
        tabId: event.target.id,
      })
    );
  };

  const JobResultError = () => (
    <Box textAlign="center">
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box component={ErrorIcon} mr={1} />
        <Typography>Job results not available</Typography>
      </Box>
      Job Id: <b>{jobId}</b>
    </Box>
  );

  const renderListTab = () => (
    <TabPanel value={openTab} index={0}>
      <TreeView
        aria-label="job-results-tree"
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        sx={{ flexGrow: 1, overflowY: "auto" }}
      >
        <Typography
          variant="body2"
          sx={{ mb: 1, textAlign: "right", fontWeight: "bold" }}
        >
          Job Id: ({jobId})
        </Typography>
        {renderTree(results)}
      </TreeView>
    </TabPanel>
  );

  const renderViewTab = () => {
    const ImageFile = () => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={resultItem.content} alt={selectedFile} />
      </Box>
    );

    const TextFile = () => (
      <Box sx={{ wordWrap: "break-word", p: 2, mt: 2 }}>
        {resultItem.content}
      </Box>
    );

    const UnsupportedFile = () => (
      <Box sx={{ wordWrap: "break-word", p: 2, mt: 2 }}>
        Visualization for this file type is not supported in the browser. Please
        download and view.
      </Box>
    );

    const renderFileContent = () => {
      switch (resultItem.type) {
        case resultItemSupportedTypes.IMAGE:
          return <ImageFile />;

        case resultItemSupportedTypes.TEXT:
          return <TextFile />;

        case resultItemSupportedTypes.CSV:
          return <CsvFile csvContent={resultItem.content} />;
        default:
          return <UnsupportedFile />;
      }
    };

    return (
      <TabPanel value={openTab} index={1}>
        {renderFileContent()}
      </TabPanel>
    );
  };

  const renderTree = (treeItems) => {
    return (
      <>
        {treeItems.map((res, idx) =>
          res.children.length ? (
            <StyledTreeItem
              key={`${res.name}_${idx}`}
              jobId={jobId}
              nodeId={res.path}
              labelText={res.name}
              labelIcon={FolderIcon}
            >
              {renderTree(res.children)}
            </StyledTreeItem>
          ) : (
            <StyledTreeItem
              key={`${res.name}_${idx}`}
              jobId={jobId}
              nodeId={res.path}
              labelText={res.name}
              labelIcon={FileIcon}
              iconColor="#28a745"
            />
          )
        )}
      </>
    );
  };

  const renderViewTabLabel = Boolean(selectedFile) ? (
    <>
      View (<b>{selectedFile.split("/").pop()}</b>)
    </>
  ) : (
    "View"
  );

  return loading ? (
    <Grid container>
      <Grid item container xs={12} justifyContent="center">
        <CircularProgress />
      </Grid>
      <Grid item container xs={12} justifyContent="center" mt={2}>
        <div>Loading results...</div>
      </Grid>
    </Grid>
  ) : results.length ? (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={openTab}
        onChange={handleChangeTab}
        aria-label="job result tabs"
        sx={{ "& .MuiTab-root": { display: "block" } }}
      >
        <Tab label="List" {...a11yProps(0)} />
        <Tab
          label={renderViewTabLabel}
          disabled={!Boolean(selectedFile)}
          {...a11yProps(1)}
        />
      </Tabs>
      {renderListTab()}
      {renderViewTab()}
    </Box>
  ) : (
    <JobResultError />
  );
};

export default ResultTree;
