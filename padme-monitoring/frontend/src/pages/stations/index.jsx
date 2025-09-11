import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

import StationTable from './StationTable';

export default function Stations() {
  return (
    <>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Stations
      </Typography>
      <Paper
        elevation={0}
        className="flex h-[calc(100dvh-210px)] min-h-96"
        sx={{
          '& .MuiDataGrid-toolbarContainer': {
            paddingTop: 0.6,
            paddingBottom: 0.5,
            paddingLeft: 0.8,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
        }}
      >
        <StationTable />
      </Paper>
    </>
  );
}
