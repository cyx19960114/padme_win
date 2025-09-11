import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import config from '../config';

export const useJobSSE = () => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Close existing connections if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${config.apiUrl}/jobs/sse`);
    eventSourceRef.current = eventSource;

    // Handle job updates
    eventSource.addEventListener('job_update', (event) => {
      try {
        const updatedJob = JSON.parse(event.data);

        // Update jobs list
        queryClient.setQueryData(['jobs'], (prevJobs) => {
          if (!prevJobs) return [updatedJob];

          const jobExists = prevJobs.some(
            (job) => job.identifier === updatedJob.identifier
          );

          if (jobExists) {
            return prevJobs.map((job) =>
              job.identifier === updatedJob.identifier ? updatedJob : job
            );
          } else {
            // Add job to list if it's new
            return [...prevJobs, updatedJob];
          }
        });

        // Update individual job query
        queryClient.setQueryData(
          ['jobs', { id: updatedJob.identifier }],
          updatedJob
        );
      } catch (error) {
        console.error('Error processing job update:', error);
      }
    });

    // Handle server hearbeats
    eventSource.addEventListener('ping', (event) => {
      console.debug('Received server heartbeat:', event.data);
    });

    // Handle connection opening
    eventSource.onopen = () => {
      console.log('Job SSE connection established');
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('Error in job sse connection:', error);

      // Close the errored connection
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [queryClient]);
};
