import axios from '../service/axios';
import { throwErrorBasedOnResponse } from '../utils/helper';

export async function getTrainCount({ signal }) {
  try {
    const response = await axios.get('/trains/count', { signal });
    return response.data.count;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}

export async function getStationCount({ signal }) {
  try {
    const response = await axios.get('/stations/count', { signal });
    return response.data.count;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}

export async function getJobCountByState({ signal, state }) {
  try {
    const response = await axios.get('/jobs/count', {
      params: { state },
      signal,
    });
    return response.data.count;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}

export async function getJobSummaryByState({ signal }) {
  try {
    const response = await axios.get('/jobs/summary', { signal });
    return response.data;
  } catch (error) {
    throwErrorBasedOnResponse(error);
  }
}
