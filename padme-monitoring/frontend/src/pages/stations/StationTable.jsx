import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import EmptyRowsOverlay from '../../layout/table/EmptyRowsOverlay';
import { LightTooltip } from '../../components/tooltip';
import { formatDate, renderRowIds } from '../../utils/helper';
import { getStations } from '../../api/station';

function StationTable() {
  const navigate = useNavigate();
  const {
    data: stations,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['stations'],
    queryFn: getStations,
  });

  if (isError) {
    toast.error(error.message);
  }

  const columns = React.useMemo(
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
        headerName: 'Station ID',
        width: 200,
        editable: true,
        renderCell: (params) => <code>{params.value}</code>,
      },
      { field: 'title', headerName: 'Name' },
      { field: 'stationOwner', headerName: 'Owner', width: 130 },
      { field: 'responsibleForStation', headerName: 'Admin', width: 130 },
      { field: 'description', headerName: 'Description', width: 300 },
      { field: 'longitude', headerName: 'Longitude', width: 120 },
      { field: 'latitude', headerName: 'Latitute', width: 120 },
      {
        field: 'createdAt',
        headerName: 'Created at',
        width: 150,
        valueGetter: formatDate,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated at',
        width: 150,
        valueGetter: formatDate,
      },
      {
        field: 'actions',
        type: 'actions',
        pinned: 'right', // Pin the last column to the right
        getActions: (params) => [
          /* eslint-disable react/jsx-key */
          <GridActionsCellItem
            label="View train details"
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
    [navigate]
  );

  return (
    <DataGrid
      rows={stations}
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
      slotProps={{
        toolbar: {
          showQuickFilter: true,
        },
      }}
    />
  );
}

export default StationTable;
