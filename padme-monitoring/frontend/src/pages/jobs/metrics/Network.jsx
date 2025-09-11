import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from '@mui/x-charts/LineChart';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getJotMetrics } from '../../../api/job';

function formatDate(dateStr) {
  const date = parseISO(dateStr);
  return format(date, 'HH:mm:ss');
}

export default function NetworkMetric({ jobId }) {
  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs', { id: jobId, metric: 'network' }],
    queryFn: ({ signal }) =>
      getJotMetrics({ signal, jobId, metric: 'network', sortDesc: false }),
    gcTime: 30000,
  });

  if (isError) toast.error(error.message);

  return (
    <Paper className="w-full rounded-xl px-5 py-4" elevation={0}>
      <Stack alignItems="center" spacing={0.5}>
        <Typography className="text-sm font-bold uppercase text-gray-500">
          Network Usage
        </Typography>
        <LineChart
          dataset={events?.metrics || []}
          grid={{ horizontal: true }}
          loading={isLoading}
          xAxis={[
            {
              id: 'Years',
              dataKey: 'timestamp',
              scaleType: 'point',
              valueFormatter: (date) => formatDate(date, 'HH:mm:ss'),
            },
          ]}
          series={[
            {
              id: 'ReceivedBytes',
              label: 'Bytes received (rx)',
              dataKey: 'rxBytes',
              stack: 'total',
              area: true,
              showMark: false,
            },
            {
              id: 'TransmittedBytes',
              label: 'Bytes transmitted (tx)',
              dataKey: 'txBytes',
              stack: 'total',
              area: true,
              showMark: false,
            },
          ]}
          width={500}
          height={280}
          margin={{ left: 70 }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
        />
      </Stack>
    </Paper>
  );
}
