import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PieChart from './PieChart';

function SummaryChart() {
  return (
    <Paper className="h-full rounded-xl p-6" variant="outlined">
      <Stack direction="column" spacing={4}>
        <Typography className="text-xl font-bold">
          Job Status Summary
        </Typography>
        <div className="flex">
          <PieChart />
        </div>
      </Stack>
    </Paper>
  );
}

export default SummaryChart;
