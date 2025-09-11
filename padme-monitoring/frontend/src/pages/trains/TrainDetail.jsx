import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { getTrainDetails } from '../../api/train';
import { formatDate } from '../../utils/helper';

export default function TrainDetailPage() {
  const { trainId } = useParams();

  const {
    data: trainDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['trains', { id: trainId }],
    queryFn: ({ signal }) => getTrainDetails({ signal, trainId }),
  });

  if (isError) toast.error(error.message);

  return (
    <>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="h4" fontWeight="bold">
          {trainDetails?.title}
        </Typography>
        <Chip
          className="font-bold"
          size="small"
          label={`v${trainDetails?.version}`}
          color="warning"
        />
      </Stack>
      <Stack mt={1.5} direction="row" alignItems="center" spacing={1}>
        <Typography
          className="rounded-md border-2 border-stone-600 px-1 font-semibold uppercase tracking-wide"
          variant="body2"
        >
          Created By
        </Typography>
        <Typography>{trainDetails?.creator}</Typography>
      </Stack>
      <Grid container mt={3} spacing={2}>
        {/* Description */}
        <Grid container size={{ md: 6, xs: 12 }}>
          <Grid size={12}>
            <Paper
              className="h-full rounded-xl"
              elevation={0}
              sx={{ padding: 3 }}
            >
              <Typography className="font-bold text-stone-600" gutterBottom>
                Analysis Purpose
              </Typography>
              <Typography>{trainDetails?.analysisPurpose}</Typography>
            </Paper>
          </Grid>
          <Grid size={12}>
            <Paper
              className="h-full rounded-xl"
              elevation={0}
              sx={{ padding: 3 }}
            >
              <Typography className="font-bold text-stone-600" gutterBottom>
                Description
              </Typography>
              <Typography>{trainDetails?.description}</Typography>
            </Paper>
          </Grid>
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
                  Train ID:
                </Typography>
                <code>{trainId}</code>
              </Stack>
              {/* Metadata URI */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Metadata URI:
                </Typography>
                <code>{trainDetails?.metadataUri}</code>
              </Stack>
              {/* Publisher */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Published By:
                </Typography>
                <code>{trainDetails?.publisher}</code>
              </Stack>
              {/* Created at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Created at:
                </Typography>
                <code>
                  {trainDetails && formatDate(trainDetails?.createdAt)}
                </code>
              </Stack>
              {/* Updated at */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Updated at:
                </Typography>
                <code>
                  {trainDetails && formatDate(trainDetails?.updatedAt)}
                </code>
              </Stack>
              {/* Model */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography className="font-bold text-stone-600">
                  Model:
                </Typography>
                <code>{trainDetails?.model || 'N/A'}</code>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
