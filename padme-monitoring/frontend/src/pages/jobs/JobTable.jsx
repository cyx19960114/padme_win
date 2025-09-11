import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Chip from '@mui/material/Chip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import EmptyRowsOverlay from '../../layout/table/EmptyRowsOverlay';
import { getJobs } from '../../api/job';
import { LightTooltip } from '../../components/tooltip';
import { chipColor } from '../../components/chip';
import { formatDate, renderRowIds } from '../../utils/helper';
import { useJobSSE } from '../../hooks/useJobSSE';

function renderCodeFmt(params) {
  return <code>{params.value}</code>;
}

function JobTable() {
  const navigate = useNavigate();
  const [density, setDensity] = useState('comfortable');

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

  if (isError) {
    toast.error(error.message);
  }

  const columns = useMemo(
    () => [
      {
        field: 'lineNo',
        headerName: '#',
        width: 60,
        editable: false,
        resizable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: renderRowIds,
      },
      {
        field: 'identifier',
        headerName: 'Job ID',
        editable: true,
        resizable: false,
        width: 200,
        renderCell: renderCodeFmt,
      },
      {
        field: 'state',
        headerName: 'State',
        resizable: false,
        width: 130,
        renderCell: (params) => {
          const label = params.value;
          const chipSize = density !== 'comfortable' ? 'small' : 'medium';

          return (
            <Chip
              className="font-semibold"
              variant="outlined"
              sx={{ width: 120 }}
              label={label}
              size={chipSize}
              icon={chipColor[label].icon}
              color={chipColor[label].color}
            />
          );
        },
      },
      {
        field: 'trainId',
        headerName: 'Train Name',
        width: 150,
        valueGetter: (value) => value.split('/').pop(),
        renderCell: renderCodeFmt,
      },
      {
        field: 'currentStation',
        headerName: 'Curr. Station',
        description: 'The current station where the train is executing.',
        resizable: false,
        width: 120,
        valueGetter: (value) => value.name,
        renderCell: renderCodeFmt,
      },
      { field: 'creator', headerName: 'Creator', resizable: false, width: 120 },
      {
        field: 'description',
        headerName: 'Description',
        resizable: false,
        width: 300,
      },
      {
        field: 'createdAt',
        headerName: 'Created At',
        resizable: false,
        sortable: false,
        width: 160,
        valueGetter: formatDate,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        resizable: false,
        sortable: false,
        width: 160,
        valueGetter: formatDate,
      },
      {
        field: 'actions',
        type: 'actions',
        width: 100,
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
            onClick={() => navigate(params.id)}
          />,
        ],
      },
    ],
    [navigate, density]
  );

  const handleDensityChange = useCallback((newDensity) => {
    setDensity(newDensity);
  }, []);

  return (
    <DataGrid
      rows={jobs}
      columns={columns}
      loading={isLoading}
      getRowId={(row) => row.identifier}
      pageSizeOptions={[20]}
      disableRowSelectionOnClick
      initialState={{
        density: 'comfortable',
        pagination: {
          paginationModel: {
            pageSize: 20,
          },
        },
      }}
      slots={{ noRowsOverlay: EmptyRowsOverlay, toolbar: GridToolbar }}
      onDensityChange={handleDensityChange}
      slotProps={{
        toolbar: {
          showQuickFilter: true,
        },
      }}
    />
  );
}

export default JobTable;
