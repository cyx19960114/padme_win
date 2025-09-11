import axios from '../service/axios';
import { throwErrorBasedOnResponse } from '../utils/helper';

export async function getJobs({ signal }) {
  try {
    const response = await axios.get('/jobs', {
      params: {
        response_type: 'default',
        offset: 0,
        limit: 10,
      },
      signal,
    });
    return response.data;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}

export async function getJotDetails({ signal, jobId }) {
  try {
    const response = await axios.get(`/jobs/${jobId}`, {
      params: {
        response_type: 'default',
      },
      signal,
    });
    return response.data;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}

export async function getJotMetrics({ signal, jobId, metric, sortDesc }) {
  try {
    const response = await axios.get(`/jobs/${jobId}/metrics`, {
      params: { metric, sort_desc: sortDesc },
      signal,
    });
    return response.data;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}
