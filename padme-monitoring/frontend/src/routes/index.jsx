import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardPage from '../pages/dashboard';
import TrainsPage from '../pages/trains';
import TrainDetailPage from '../pages/trains/TrainDetail';
import StationsPage from '../pages/stations';
import StationDetailPage from '../pages/stations/StationDetail';
import JobsPage from '../pages/jobs';
import JobDetailPage from '../pages/jobs/JobDetail';
import PageNotFound from '../pages/PageNotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="trains">
        <Route index element={<TrainsPage />} />
        <Route path=":trainId" element={<TrainDetailPage />} />
      </Route>
      <Route path="stations">
        <Route index element={<StationsPage />} />
        <Route path=":stationId" element={<StationDetailPage />} />
      </Route>
      <Route path="jobs">
        <Route index element={<JobsPage />} />
        <Route path=":jobId" element={<JobDetailPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
