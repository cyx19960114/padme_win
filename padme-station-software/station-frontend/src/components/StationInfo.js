import React, { useState, useEffect } from 'react';
import { getCurrentStationInfo, getStationDisplayName, getStationStatus } from '../services/StationService';

const StationInfo = () => {
  const [stationInfo, setStationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStationInfo = async () => {
      try {
        setLoading(true);
        const info = await getCurrentStationInfo();
        setStationInfo(info);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch station info:', err);
        setError(err.message || 'Failed to load station information');
      } finally {
        setLoading(false);
      }
    };

    fetchStationInfo();
  }, []);

  if (loading) {
    return (
      <div className="station-info loading">
        <div className="station-info-header">
          <h3>Station Information</h3>
        </div>
        <div className="station-info-content">
          <p>Loading station information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="station-info error">
        <div className="station-info-header">
          <h3>Station Information</h3>
        </div>
        <div className="station-info-content">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stationInfo) {
    return (
      <div className="station-info no-data">
        <div className="station-info-header">
          <h3>Station Information</h3>
        </div>
        <div className="station-info-content">
          <p>No station information available</p>
        </div>
      </div>
    );
  }

  const status = getStationStatus(stationInfo);

  return (
    <div className="station-info">
      <div className="station-info-header">
        <h3>Current Station</h3>
        <div className="station-status-indicator">
          <span className={`status-dot ${status.status}`}></span>
          <span className="status-text">{status.status.toUpperCase()}</span>
        </div>
      </div>
      
      <div className="station-info-content">
        <div className="station-details">
          <div className="station-detail-item">
            <label>Station Name:</label>
            <span className="station-name">{stationInfo.stationName}</span>
          </div>
          
          <div className="station-detail-item">
            <label>Station ID:</label>
            <span className="station-id">{stationInfo.stationId}</span>
          </div>
          
          <div className="station-detail-item">
            <label>Username:</label>
            <span className="username">{stationInfo.username}</span>
          </div>
          
          <div className="station-detail-item">
            <label>Email:</label>
            <span className="email">{stationInfo.email}</span>
          </div>
          
          <div className="station-detail-item">
            <label>Harbor User:</label>
            <span className="harbor-user">{stationInfo.harborUser}</span>
          </div>
        </div>
        
        <div className="station-message">
          <p>{status.message}</p>
        </div>
      </div>
      
      <style jsx>{`
        .station-info {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .station-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .station-info-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.2em;
        }
        
        .station-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .status-dot.active {
          background-color: #28a745;
        }
        
        .status-dot.unknown {
          background-color: #6c757d;
        }
        
        .status-text {
          font-size: 0.8em;
          font-weight: bold;
          color: #495057;
        }
        
        .station-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .station-detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .station-detail-item label {
          font-weight: bold;
          color: #6c757d;
          font-size: 0.9em;
        }
        
        .station-detail-item span {
          color: #495057;
          font-size: 1em;
        }
        
        .station-name {
          font-weight: bold;
          color: #007bff;
        }
        
        .station-id {
          font-family: monospace;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        
        .username {
          color: #28a745;
          font-weight: bold;
        }
        
        .email {
          color: #6f42c1;
        }
        
        .harbor-user {
          color: #fd7e14;
          font-weight: bold;
        }
        
        .station-message {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          padding: 10px;
          margin-top: 15px;
        }
        
        .station-message p {
          margin: 0;
          color: #004085;
          font-size: 0.9em;
        }
        
        .error-message {
          color: #dc3545;
          font-weight: bold;
        }
        
        .loading, .error, .no-data {
          text-align: center;
          padding: 40px 20px;
        }
        
        .loading p, .error p, .no-data p {
          margin: 0;
          color: #6c757d;
        }
        
        @media (max-width: 768px) {
          .station-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StationInfo;
