import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import { styled } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useDrawingArea } from '@mui/x-charts/hooks';

import { getJobSummaryByState } from '../../../api/dashboard';

const colorMap = {
  running: '#3b82f6',
  waiting: '#eab308',
  finished: '#22c55e',
  failed: '#ef4444',
  cancelled: '#6b7280',
};

export default function PieChart() {
  const {
    data: jobSummary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs', { summary: true }],
    queryFn: getJobSummaryByState,
  });

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    toast.error(error.message);
    return null;
  }

  let jobCount = 0;
  const chartData = jobSummary.map(({ state, count }, idx) => {
    jobCount += count;

    return {
      id: idx + 1,
      label: state,
      value: count,
      color: colorMap[state],
    };
  });

  return (
    <MuiPieChart
      margin={{ left: -50 }}
      loading={isLoading}
      series={[
        {
          data: chartData,
          // valueFormatter: (v, _) => {
          //   return '10% of the total jobs';
          // },
          innerRadius: 95,
          outerRadius: 125,
          paddingAngle: 1,
          cornerRadius: 4,
          highlightScope: { fade: 'global', highlight: 'item' },
          faded: {
            innerRadius: 90,
            additionalRadius: -5,
            color: 'gray',
          },
        },
      ]}
      width={400}
      height={300}
      slotProps={{
        legend: {
          labelStyle: {
            fontWeight: '600',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
          },
          itemGap: 10,
          // padding: -5,
        },
      }}
    >
      <PieCenterLabel className="text-3xl font-bold" offset={-10}>
        {jobCount}
      </PieCenterLabel>
      <PieCenterLabel className="text-sm font-semibold" offset={20}>
        Total Jobs
      </PieCenterLabel>
    </MuiPieChart>
  );
}

const StyledText = styled('text')(({ theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 20,
}));

function PieCenterLabel({ className, children, offset = 0 }) {
  const { width, height, left, top } = useDrawingArea();

  return (
    <StyledText
      className={className}
      x={left + width / 2}
      y={offset + top + height / 2}
    >
      {children}
    </StyledText>
  );
}
