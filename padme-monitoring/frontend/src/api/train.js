import axios from '../service/axios';
import { throwErrorBasedOnResponse } from '../utils/helper';

export async function getTrains({ signal }) {
  try {
    const response = await axios.get('/trains', {
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

export async function getTrainDetails({ signal, trainId }) {
  try {
    const response = await axios.get(`/trains/${trainId}`, {
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
