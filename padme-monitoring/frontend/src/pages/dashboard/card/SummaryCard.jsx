import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import JobsIcon from '@mui/icons-material/WorkHistoryOutlined';
import StationIcon from '@mui/icons-material/WarehouseOutlined';
import TrainIcon from '@mui/icons-material/TrainOutlined';

function SummaryCard({ title, value, type }) {
  return (
    <Paper className="flex h-full rounded-xl px-6 py-4" variant="outlined">
      <Stack direction="row" alignItems="center" spacing={3.5} py={1}>
        <Avatar
          className={`h-16 w-16 border-[3px] bg-white ${summaryProps[type].color}`}
        >
          {summaryProps[type].icon}
        </Avatar>
        <Stack className="sm:ml-2" direction="column" spacing={1}>
          <Typography className="text-sm font-bold uppercase text-gray-500">
            {title}
          </Typography>
          <Typography variant="h4" className="font-semibold">
            {value}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

// Since we can't dynamically create colors for tailwind using
// template liternals, we will create a map with some defined keys.
//
// Ref: https://tailwindcss.com/docs/content-configuration#dynamic-class-names
const summaryProps = {
  train: {
    color: 'text-green-500 border-green-200',
    icon: <TrainIcon fontSize="large" />,
  },
  station: {
    color: 'text-orange-500 border-orange-200',
    icon: <StationIcon fontSize="large" />,
  },
  waitingJob: {
    color: 'text-yellow-500 border-yellow-200',
    icon: <JobsIcon fontSize="large" />,
  },
  runningJob: {
    color: 'text-blue-500 border-blue-200',
    icon: <JobsIcon fontSize="large" />,
  },
  failedJob: {
    color: 'text-red-500 border-red-200',
    icon: <ErrorIcon fontSize="large" />,
  },
  cancelledJob: {
    color: 'text-gray-500 border-gray-200',
    icon: <CloseIcon fontSize="large" />,
  },
};

export default SummaryCard;
