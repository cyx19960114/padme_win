import { useQuery } from '@tanstack/react-query';

import SummaryCard from './SummaryCard';
import { getJobCountByState } from '../../../api/dashboard';

const jobStateProps = {
  running: { type: 'runningJob', title: 'Running Jobs' },
  waiting: { type: 'waitingJob', title: 'Waiting Jobs' },
  failed: { type: 'failedJob', title: 'Failed Jobs' },
  cancelled: { type: 'cancelledJob', title: 'Cancelled Jobs' },
};

function JobSummaryCard({ state }) {
  const { data: count } = useQuery({
    queryKey: ['jobs', { count: true, state }],
    queryFn: ({ signal }) => getJobCountByState({ signal, state }),
  });

  return (
    <SummaryCard
      type={jobStateProps[state].type}
      title={jobStateProps[state].title}
      value={count}
    />
  );
}

export default JobSummaryCard;
