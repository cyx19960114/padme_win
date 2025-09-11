import { useQuery } from '@tanstack/react-query';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getGaugeColor } from '../../../utils/helper';
import { getJotMetrics } from '../../../api/job';

export default function CpuMetric({ jobId }) {
  const {
    data: events,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs', { id: jobId, metric: 'cpu' }],
    queryFn: ({ signal }) =>
      getJotMetrics({ signal, jobId, metric: 'cpu', sortDesc: true }),
    gcTime: 30000,
  });

  const value = parseFloat(
    events?.metrics?.length > 0 ? events.metrics[0].value : '0'
  );

  if (isError) toast.error(error.message);

  return (
    <Paper className="w-full rounded-xl px-5 py-4" elevation={0}>
      <Stack alignItems="center" spacing={0.5}>
        <Typography className="text-sm font-bold uppercase text-gray-500">
          CPU Usage
        </Typography>
        <Gauge
          value={value}
          width={150}
          height={150}
          startAngle={-110}
          endAngle={110}
          innerRadius="70%"
          text={(prop) => `${prop.value}%`}
          sx={{
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: 20,
              fontWeight: 600,
              transform: 'translate(0px, 0px)',
            },
            [`& .${gaugeClasses.valueArc}`]: {
              fill: getGaugeColor(value),
            },
          }}
        />
      </Stack>
    </Paper>
  );
}
