import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import TrainTable from './TrainTable';

export default function Trains() {
  return (
    <>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Trains
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
        <TrainTable />
      </Paper>
    </>
  );
}
