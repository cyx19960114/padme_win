import { useQuery } from '@tanstack/react-query';

import SummaryCard from './SummaryCard';
import { getTrainCount } from '../../../api/dashboard';

function TrainSummaryCard() {
  const { data: trainCount } = useQuery({
    queryKey: ['trains', { count: true }],
    queryFn: getTrainCount,
  });

  return <SummaryCard type="train" title="Trains" value={trainCount} />;
}

export default TrainSummaryCard;
