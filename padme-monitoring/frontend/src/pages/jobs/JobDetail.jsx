import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import CpuMetric from './metrics/Cpu';
import MemoryMetric from './metrics/Memory';
import NetworkMetric from './metrics/Network';
import { getJotDetails } from '../../api/job';
import { formatDate } from '../../utils/helper';
import { chipColor } from '../../components/chip';
import { useJobSSE } from '../../hooks/useJobSSE';
import { useMetricSSE } from '../../hooks/useMetricSSE';

export default function JobDetailPage() {
  const { jobId } = useParams();

  // Set up SSE listener for job and metric updates
  useJobSSE();
  useMetricSSE(jobId)

  const {
    data: jobDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobs', { id: jobId }],
    queryFn: ({ signal }) => getJotDetails({ signal, jobId }),
  });

  const jobStatus = jobDetails?.state;

  if (isError) toast.error(error.message);

  return (
    <>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        justifyContent="space-between"
        gap={2}
      >
        <Stack spacing={1.5}>
          <Typography variant="h4" fontWeight="bold">
            {jobId}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              className="rounded-md border-2 border-stone-600 px-1 font-semibold uppercase tracking-wide"
              variant="body2"
            >
              Created By
            </Typography>
            <Typography>{jobDetails?.creator}</Typography>
          </Stack>
        </Stack>
        {/* METRICS */}
        <Paper className="h-full rounded-xl" elevation={0} sx={{ padding: 3 }}>
          <Stack spacing={1}>
            <Typography className="font-bold text-stone-600">
              Description
            </Typography>
            <Typography>{jobDetails?.description}</Typography>
          </Stack>
        </Paper>
      </Stack>
      <Grid container mt={3} spacing={2}>
        {/* Description */}
        <Grid container size={{ md: 5, xs: 12 }}>
          <Grid size={{ xs: 6 }}>
            <CpuMetric jobId={jobId} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <MemoryMetric jobId={jobId} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <NetworkMetric jobId={jobId} />
          </Grid>
        </Grid>
        {/* Other Details */}
        <Grid size={{ md: 7, xs: 12 }}>
          <Paper
            className="h-full rounded-xl"
            elevation={0}
            sx={{ padding: 3 }}
          >
            <Stack rowGap={2} divider={<Divider flexItem />}>
              {/* STATUS */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Job Status:
                </Typography>
                <Chip
                  className="w-[8rem] text-sm font-bold"
                  label={jobStatus}
                  sx={{ paddingX: 0.5 }}
                  icon={chipColor[jobStatus]?.icon}
                  color={chipColor[jobStatus]?.color}
                />
              </Stack>
              {/* Metadata URI */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Metadata URI:
                </Typography>
                <code>{jobDetails?.metadataUri}</code>
              </Stack>
              {/* Train URI */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Train URI:
                </Typography>
                <code>{jobDetails?.trainId}</code>
              </Stack>
              {/* Current Station */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Current Station:
                </Typography>
                <code>{jobDetails?.currentStation.name}</code>
              </Stack>
              {/* Created at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Created at:
                </Typography>
                <code>{jobDetails && formatDate(jobDetails?.createdAt)}</code>
              </Stack>
              {/* Updated at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Updated at:
                </Typography>
                <code>{jobDetails && formatDate(jobDetails?.updatedAt)}</code>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
