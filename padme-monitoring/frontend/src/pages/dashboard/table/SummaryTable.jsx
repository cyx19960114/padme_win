import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UpdateIcon from '@mui/icons-material/Update';

import { chipColor } from '../../../components/chip';
import { getJobs } from '../../../api/job';
import { LightTooltip } from '../../../components/tooltip';
import { useJobSSE } from '../../../hooks/useJobSSE';

function SummaryTable() {
  const navigate = useNavigate();
  
  // Set up SSE listener for jobs
  useJobSSE();
  
  const {
    data: jobs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });

  const lastUpdated = jobs?.length ? jobs[0].updatedAt : null; // Assuming jobs[0].updated is the latest timestamp
  const timeAgo = lastUpdated
    ? formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true })
    : 'N/A';

  const columns = useMemo(
    () => [
      {
        field: 'identifier',
        headerName: 'Job ID',
        width: 155,
        editable: true,
        resizable: false,
      },
      {
        field: 'state',
        headerName: 'State',
        width: 120,
        resizable: false,
        cellClassName: 'job-summary-state',
        renderCell: (params) => {
          const label = params.value;
          return (
            <Chip
              className="font-semibold"
              variant="outlined"
              size="small"
              sx={{ width: 120 }}
              label={label}
              icon={chipColor[label].icon}
              color={chipColor[label].color}
            />
          );
        },
      },
      {
        field: 'trainId',
        headerName: 'Train Name',
        width: 130,
        valueGetter: (value) => value.split('/').pop(),
      },
      {
        field: 'currentStation',
        headerName: 'Curr. Station',
        description: 'The current station where the train is executing.',
        width: 120,
        resizable: false,
        valueGetter: (value) => value.name,
      },
      { field: 'creator', headerName: 'Creator', width: 120, resizable: false },
      {
        field: 'actions',
        type: 'actions',
        resizable: false,
        getActions: (params) => [
          /* eslint-disable react/jsx-key */
          <GridActionsCellItem
            label="View job details"
            icon={
              <LightTooltip
                disableInteractive
                placement="left"
                title="View details"
              >
                <OpenInNewIcon />
              </LightTooltip>
            }
            onClick={() => navigate(`/jobs/${params.id}`)}
          />,
        ],
      },
    ],
    [navigate]
  );

  if (isError) {
    toast.error(error.message);
  }

  return (
    <Paper className="h-full rounded-xl p-6" variant="outlined">
      <Stack direction="column" spacing={3}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography className="text-xl font-bold">Recent Jobs</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <UpdateIcon fontSize="small" />
            <Typography className="text-sm font-semibold text-gray-600">
              Updated: {timeAgo}
            </Typography>
          </Stack>
        </Stack>
        <Box
          className="h-[293px] w-full"
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
            '& .job-summary-state': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <DataGrid
            rows={jobs?.slice(0, 7)}
            columns={columns}
            getRowId={(row) => row.identifier}
            loading={isLoading}
            density="compact"
            disableColumnMenu
            disableRowSelectionOnClick
            hideFooter
          />
        </Box>
      </Stack>
    </Paper>
  );
}

export default SummaryTable;
