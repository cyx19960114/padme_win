import { useQuery } from '@tanstack/react-query';

import SummaryCard from './SummaryCard';
import { getStationCount } from '../../../api/dashboard';

function StationSummaryCard() {
  const { data: stationCount } = useQuery({
    queryKey: ['stations', { count: true }],
    queryFn: getStationCount,
  });

  return <SummaryCard type="station" title="Stations" value={stationCount} />;
}

export default StationSummaryCard;
