import { format, parseISO } from 'date-fns';

function formatDate(dateStr) {
  const date = parseISO(dateStr);
  return format(date, 'MMM d, yyyy h:mm a');
}

const getGaugeColor = (value) => {
  // Green for normal range
  if (value < 80) return '#52b202';
  // Orange for warning range
  if (value < 90) return '#FFA500';
  // Red for critical range
  return '#ef4444';
};

function renderRowIds(params) {
  return params.api.getAllRowIds().indexOf(params.id) + 1;
}

function throwErrorBasedOnResponse(error) {
  if (error.response) {
    // Server responded with a status other than 2xx
    throw new Error(
      `Error: ${error.response.status} - ${error.response.data.detail}`
    );
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Error: No response received from server');
  } else {
    // Something else happened while setting up the request
    throw new Error(`Error: ${error.message}`);
  }
}

export { formatDate, getGaugeColor, renderRowIds, throwErrorBasedOnResponse };
