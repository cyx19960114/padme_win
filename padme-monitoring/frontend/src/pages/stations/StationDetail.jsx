import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

import { formatDate } from '../../utils/helper';
import { getStationDetails } from '../../api/station';

export default function StationDetailPage() {
  const { stationId } = useParams();

  const {
    data: stationDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['stations', { id: stationId }],
    queryFn: ({ signal }) => getStationDetails({ signal, stationId }),
  });

  // Derived state
  const hasGPUSupport = stationDetails?.hasGPUSupport;
  const hasInternetSupport = stationDetails?.hasInternetConnectivity;

  if (isError) toast.error(error.message);

  return (
    <>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        alignItems={{ md: 'center', sm: '-moz-initial' }}
        justifyContent="space-between"
        gap={2}
        // spacing={2}
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            alignItems="center"
            gap={3}
          >
            <Typography variant="h4" fontWeight="bold">
              {stationDetails?.title}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip
                className="text-sm font-bold"
                label={hasGPUSupport ? 'GPU supported' : 'GPU not supported'}
                sx={{ paddingX: 0.5 }}
                icon={hasGPUSupport ? <CheckIcon /> : <ClearIcon />}
                color={hasGPUSupport ? 'success' : 'warning'}
              />
              <Chip
                className="text-sm font-bold"
                label={
                  hasInternetSupport ? 'Internet Connectivity' : 'No Internet'
                }
                sx={{ paddingX: 0.5 }}
                icon={hasInternetSupport ? <CheckIcon /> : <ClearIcon />}
                color={hasInternetSupport ? 'success' : 'warning'}
              />
            </Stack>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ justifyContent: { xs: 'center', md: 'unset' } }}
          >
            <Typography
              className="rounded-md border-2 border-stone-600 px-1 font-semibold uppercase tracking-wide"
              variant="body2"
            >
              Owner
            </Typography>
            <Typography className="font-semibold">
              {stationDetails?.stationOwner}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2}>
          {/* CPU */}
          <Paper className="rounded-xl px-5 py-4" elevation={0}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography className="text-sm font-bold uppercase text-gray-500">
                CPU Cores
              </Typography>
              <Typography variant="h4" className="font-semibold">
                {stationDetails?.totalCPUCores}
              </Typography>
            </Stack>
          </Paper>
          {/* RAM */}
          <Paper className="rounded-xl px-5 py-4" elevation={0}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography className="text-sm font-bold uppercase text-gray-500">
                Memory
              </Typography>
              <Typography variant="h4" className="font-semibold">
                {stationDetails?.totalRAM}
              </Typography>
            </Stack>
          </Paper>
          {/* NETWORK */}
          {hasInternetSupport && (
            <Paper className="rounded-xl px-5 py-4" elevation={0}>
              <Stack alignItems="center" spacing={0.5}>
                <Typography className="text-sm font-bold uppercase text-gray-500">
                  Network Bandwidth
                </Typography>
                <Typography variant="h4" className="font-semibold">
                  {stationDetails?.networkBandwidth}
                </Typography>
              </Stack>
            </Paper>
          )}
          {/* DISK */}
          <Paper className="rounded-xl px-5 py-4" elevation={0}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography className="text-sm font-bold uppercase text-gray-500">
                Disk Space
              </Typography>
              <Typography variant="h4" className="font-semibold">
                {stationDetails?.totalDiskSpace}
              </Typography>
            </Stack>
          </Paper>
          {/* GPU Memory */}
          {hasGPUSupport && (
            <Paper className="rounded-xl px-5 py-4" elevation={0}>
              <Stack alignItems="center" spacing={0.5}>
                <Typography className="text-sm font-bold uppercase text-gray-500">
                  GPU Memory
                </Typography>
                <Typography variant="h4" className="font-semibold">
                  {stationDetails?.totalGPUPower}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Stack>
      {/* INFO */}
      <Grid container mt={3} spacing={2}>
        {/* Description */}
        <Grid size={{ md: 6, xs: 12 }}>
          <Paper
            className="h-full rounded-xl"
            elevation={0}
            sx={{ padding: 3 }}
          >
            <Stack spacing={1}>
              <Typography className="font-bold text-stone-600">
                Description
              </Typography>
              <Typography>{stationDetails?.description}</Typography>
            </Stack>
          </Paper>
        </Grid>
        {/* Other Details */}
        <Grid size={{ md: 6, xs: 12 }}>
          <Paper
            className="h-full rounded-xl"
            elevation={0}
            sx={{ padding: 3 }}
          >
            <Stack rowGap={2} divider={<Divider flexItem />}>
              {/* ID */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Station ID:
                </Typography>
                <code>{stationId}</code>
              </Stack>
              {/* Metadata URI */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Metadata URI:
                </Typography>
                <code>{stationDetails?.metadataUri}</code>
              </Stack>
              {/* Responsible for stations */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Station admin:
                </Typography>
                <code>{stationDetails?.responsibleForStation}</code>
              </Stack>
              {/* Created at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Created at:
                </Typography>
                <code>
                  {stationDetails && formatDate(stationDetails?.createdAt)}
                </code>
              </Stack>
              {/* Updated at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Updated at:
                </Typography>
                <code>
                  {stationDetails && formatDate(stationDetails?.updatedAt)}
                </code>
              </Stack>
              {/* Model */}
              <Stack>
                <Stack direction="row" alignItems="center">
                  <Typography className="w-24 font-bold text-stone-600">
                    Latitude:
                  </Typography>
                  <code>{stationDetails?.latitude}</code>
                </Stack>
                <Stack direction="row" alignItems="center">
                  <Typography className="w-24 font-bold text-stone-600">
                    Longitude:
                  </Typography>
                  <code>{stationDetails?.longitude}</code>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
