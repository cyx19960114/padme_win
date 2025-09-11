import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import config from '../config';

export const useMetricSSE = (jobId) => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Close existing connections if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `${config.apiUrl}/jobs/${jobId}/metrics/sse`
    );
    eventSourceRef.current = eventSource;

    // Handle metric updates
    eventSource.addEventListener('metric_update', (event) => {
      try {
        const updatedMetrics = JSON.parse(event.data);

        // Update job metrics
        queryClient.setQueryData(
          ['jobs', { id: jobId, metric: updatedMetrics.source }],
          updatedMetrics
        );
      } catch (error) {
        console.error('Error processing metrics update:', error); 
      }
    });

    // Handle server hearbeats
    eventSource.addEventListener('ping', (event) => {
      console.debug('Received server heartbeat:', event.data);
    });

    // Handle connection opening
    eventSource.onopen = () => {
      console.log('Metrics SSE connection established');
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('Error in metrics sse connection:', error);

      // Close the errored connection
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [queryClient, jobId]);
};
