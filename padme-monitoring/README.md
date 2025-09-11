# PADME Monitoring

This repository contains code for the PADME Monitoring system that tracks metadata about PHT Trains, Stations, and Jobs along with real-time metrics for CPU, memory, and network utilization. The project consists of a FastAPI backend and a ReactJS frontend built with Vite and the MaterialUI Kit.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Running Locally](#running-locally)
  - [Development Workflow](#development-workflow)
- [Deployment](#deployment)
  - [Environment Variables](#environment-variables)
  - [Keycloak Setup](#keycloak-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## Overview

PADME Monitoring provides a comprehensive dashboard for tracking and visualizing Personal Health Train (PHT) operations. It collects and processes metadata about trains, stations, and running jobs, storing the information in a graph database structure using RDFLib with PostgreSQL persistence.

## Features

- **Metadata Collection**: Gather and store metadata about PHT Trains, Stations, and Jobs
- **Real-time Metrics**: Monitor CPU, memory, and network utilization in real-time
- **Interactive Dashboard**: Visualize operational data through intuitive charts and graphs
- **Server-Sent Events**: Real-time updates using SSE for continuous monitoring
- **Authentication**: Secure access control via Keycloak integration

## Technology Stack

- **Backend**:

  - FastAPI (Python web framework)
  - RDFLib (RDF graph data manipulation)
  - PostgreSQL (Data persistence)
  - Server-Sent Events (Real-time updates)

- **Frontend**:

  - React.js
  - Vite (Build tool)
  - React Query (Data fetching)
  - MUI (Component library)

- **Infrastructure**:
  - Docker & Docker Compose
  - Keycloak (Authentication)

## Development

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.12+ (for backend development)
- uv (Python package manager)

### Setup

1. **Clone the repository**:
   ```sh
   git clone https://git.rwth-aachen.de/padme-development/padme-monitoring.git
   cd padme-monitoring
   ```
2. **Backend setup**:
   ```sh
   cd backend
   # Install uv in the system if not already installed
   # Ref: https://docs.astral.sh/uv/getting-started/installation/
   # For macOS and Linux (For windows, see above link)
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # Using uv for dependency management
   uv sync
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. **Frontend setup**:
   ```sh
   cd frontend
   npm install
   ```

### Running Locally

Start all services (backend, frontend, PostgreSQL, Keycloak):

```sh
docker compose -f docker-compose.dev.yml up --watch
```

Access the services:

- Frontend: http://localhost:5173
- Backend Swagger API: http://localhost:8000/docs
- Keycloak Admin: http://localhost:8080

### Development Workflow

1. Create a feature branch from `prerelease`
2. Implement changes
3. Create a pull request
4. After review, merge to `prerelease`

## Deployment

### Environment Variables

To deploy this service, other (dependent) services need to be deployed first. See [the instructions on how to setup your own PADME instance](https://docs.padme-analytics.de/en/how-to-deploy-padme). If you have deployed the dependencies, the following variables need to be set for the deployment of the Monitoring service (via gitlab CI/CD variables, as described in the instructions mentioned above):

| Variable Name                            | Description                                                                                                                                                                                            | Example value                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| DEPLOYMENT_TARGET_DIR                    | The directory on the target host where the Monitoring compose file will be stored. We recommend the provide the exemplary value                                                                        | /home/deployment/monitoring/        |
| DEPLOYMENT_TARGET_HOST                   | The username and host where the Monitoring service should be deployed to. This needs to be in the format user@host                                                                                     | deployment@TARGET_MACHINE_HOST_NAME |
| DEPLOYMENT_TARGET_SSH_KEY                | The ssh private key that should be used to authenticate the user at the target host. If you took the recommendation in our guide, you can use the group-level variable $MACHINE_NAME_PRIVATE_KEY here. | MACHINE_NAME_PRIVATE_KEY            |
| MONITORING_SERVICE_REALM                 | The name of the realm the Monitoring service should authenticate against. If you followed our [Setup Keycloak](https://git.rwth-aachen.de/padme-development/keycloak) guide, this will be `pht`.       | pht                                 |
| MONITORING_SERVICE_FRONTEND_CLIENT_ID    | The frontend client id in Keycloak for authentication purposes.                                                                                                                                        | frontend                            |
| MONITORING_SERVICE_BACKEND_CLIENT_ID     | The backend client id in Keycloak for securing API endpoints.                                                                                                                                          | backend                             |
| MONITORING_SERVICE_BACKEND_CLIENT_SECRET | The backend client secret in Keycloak for authentication purposes. This should be copied from the Keycloak server for client $MONITORING_SERVICE_BACKEND_CLIENT_ID.                                    | bCxfpMMMYjH4n9eKhD6xDQ              |
| MONITORING_SERVICE_DB_USERNAME           | Username for the PostgreSQL database for storing metadata.                                                                                                                                             | monitor                             |
| MONITORING_SERVICE_DB_PASSWORD           | Password for the PostgreSQL database for storing metadata.                                                                                                                                             | kUqWI2PEL6MvTUqMWgkBQ               |
| MONITORING_SERVICE_DB_URL_DATABASE       | The database name for the PostgreSQL database for storing metadata.                                                                                                                                    | kUqWI2PEL6MvTUqMWgkBQ               |

> After the deployment, please follow the following instructions to finish the Keycloak setup for the playground

### Keycloak Setup

To configure Keycloak for the PADME Monitoring system, perform the following steps:

1. Go to the Keycloak "Administration Console" at `https://auth.$YOUR_DOMAIN` using your admin credentials.
2. In the realm `pht`, navigate to `Clients` in the left sidebar and create a new client by clicking `Create client`.
3. You need to create two separate clients, one for the backend and another for the frontend.

```yml
# Backend client config
Client ID: (Use the above ENV value MONITORING_SERVICE_BACKEND_CLIENT_ID)
Client type: OpenID Connect (default)
Client authentication: (Set to 'On')
Root URL: https://monitoringapi.$YOUR_DOMAIN (replace $YOUR_DOMAIN)
Valid Redirect URIs: https://monitoringapi.$YOUR_DOMAIN/*

## Click 'Save' to finish setting up the backend client.
## Start creating another client for the frontend.

# Frontend client config
Client ID: (Use the above ENV value MONITORING_SERVICE_FRONTEND_CLIENT_ID)
Client type: OpenID Connect (default)
Client authentication: (Set to 'Off'. It is already the default)
Root URL: https://monitoring.$YOUR_DOMAIN (replace $YOUR_DOMAIN)
Valid Redirect URIs: https://monitoring.$YOUR_DOMAIN/*

## Click 'Save' to finish setting up the frontend client.
```

That's it! You should now be able to access the monitoring dashboard at `https://monitoring.$YOUR_DOMAIN` and redirected to the Keycloak login page. To access the backend Swagger API, navigate to `https://monitoringapi.$YOUR_DOMAIN/docs`.

## Project Structure

```
/padme-monitoring
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/                  # API routes
│   │   ├── core/                 # Core functionality
│   │   ├── crud.py               # Common CRUD APIs
│   │   ├── main.py               # Backend main.py file
│   │   ├── models.py             # Data models
│   │   └── utils.py              # Helper functions
│   ├── Dockerfile                # Backend container definition
│   └── pyproject.toml            # Python project configuration
├── frontend/                     # React frontend
│   ├── conf/
│   │   └── nginx.conf            # Nginx conf
│   ├── public/
│   ├── src/
│   │   ├── api/                  # Axios API methods
│   │   ├── assets/               # Media
│   │   ├── components/           # Re-usable components
│   │   ├── constants/            # App Constants
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layout/               # Frontend generic layout
│   │   ├── routes/               # App routing
│   │   ├── pages/                # Page components
│   │   ├── services/             # External services
│   │   ├── store/                # Redux store
│   │   ├── styles/               # CSS styles
│   │   ├── utils/                # Helper functions
│   │   ├── App.jsx               # Frontend App component
│   │   ├── config.js             # Config file to access ENV variables
│   │   ├── main.jsx              # Frontend main entrypoint
│   │   └── theme.js              # Frontend theme config
│   ├── Dockerfile                # Frontend container definition
│   ├── Dockerfile.dev            # Frontend development container definition
│   └── package.json              # Node.js dependencies
├── docker-compose.dev.yml        # Development environment
├── docker-compose.template.yml   # Production template
├── .gitlab-ci.yml                # CI/CD pipeline configuration
└── README.md                     # Project documentation
```

## API Documentation

API documentation is available at `https://monitoringapi.$YOUR_DOMAIN/docs` when the backend is running. For a Postman collection of available endpoints:

1. Import the collection from [postman/collections/postman_collection.json](postman/collections/monitoring.postman_collection.json)
2. Set up DEV environment from [/environments](/postman/environments/). After importing the environment, add the missing values for `KC_USERNAME` and `KC_PASSWORD`.

---

© Copyright 2021-2025, PHT Working Group (PADME)
