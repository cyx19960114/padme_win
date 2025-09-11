import uuid

from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, Field

from app.utils import MetricType

version_regex = "^(0|[1-9]|10)\\.(0|[1-9]|10)\\.(0|[1-9]|10)$"

# * The properties below need to match the ones in PHT metadata schema.
# * Therefore, instead of using python's snailcase, we will use the camelcase.
# * i.e. instead of created_at, we use createdAt.


class TrainMetadataBase(BaseModel):
    identifier: str = Field(min_length=5, max_length=50)
    creator: str = Field(min_length=3, max_length=50)
    publisher: str = Field(min_length=3, max_length=50)
    title: str = Field(min_length=5, max_length=50)
    description: str = Field(min_length=10, max_length=200)
    analysisPurpose: str = Field(min_length=10, max_length=200)
    version: str = Field(pattern=version_regex, default="1.0.0")
    model: str | None = Field(min_length=3, max_length=50, default=None)
    createdAt: datetime = datetime.now()
    updatedAt: datetime = datetime.now()


class TrainMetadataUpdate(BaseModel):
    publisher: str | None = Field(min_length=3, max_length=50, default=None)
    title: str | None = Field(min_length=5, max_length=50, default=None)
    description: str | None = Field(min_length=10, max_length=200, default=None)
    analysisPurpose: str | None = Field(min_length=10, max_length=200, default=None)
    version: str | None = Field(pattern=version_regex, default=None)
    model: str | None = Field(min_length=3, max_length=50, default=None)
    updatedAt: datetime = datetime.now()


class StationMetadataBase(BaseModel):
    identifier: uuid.UUID
    title: str = Field(max_length=50)
    stationOwner: str = Field(min_length=3, max_length=50)
    responsibleForStation: str = Field(min_length=3, max_length=50)
    description: str = Field(min_length=10, max_length=200)
    latitude: str
    longitude: str
    hasGPUSupport: bool = False
    totalGPUPower: str
    totalCPUCores: int
    totalRAM: str
    totalDiskSpace: str
    hasInternetConnectivity: bool
    networkBandwidth: str
    createdAt: datetime = datetime.now()
    updatedAt: datetime = datetime.now()


class StationMetadataUpdate(BaseModel):
    title: str | None = Field(max_length=50, default=None)
    stationOwner: str | None = Field(min_length=3, max_length=50, default=None)
    responsibleForStation: str | None = Field(min_length=3, max_length=50, default=None)
    description: str | None = Field(min_length=10, max_length=200, default=None)
    latitude: str | None = None
    longitude: str | None = None
    hasGPUSupport: bool | None = False
    totalGPUPower: str | None = None
    totalCPUCores: int | None = None
    totalRAM: str | None = None
    totalDiskSpace: str | None = None
    hasInternetConnectivity: bool | None = None
    networkBandwidth: str | None = None
    updatedAt: datetime | None = datetime.now()


class JobMetadataBase(BaseModel):
    identifier: uuid.UUID
    description: str = Field(min_length=10, max_length=200)
    trainId: str = Field(min_length=3, max_length=50)
    currentStation: str
    creator: str = Field(min_length=3, max_length=50)
    plannedRoute: list[Annotated[str, Field(min_length=3, max_length=50)]] = Field(
        min_length=1
    )
    createdAt: datetime = datetime.now()
    updatedAt: datetime = datetime.now()


class BaseJobMetric(BaseModel):
    station_id: uuid.UUID
    timestamp: datetime = datetime.now()


class ResourceMetric(BaseJobMetric):
    metric_type: Annotated[
        Literal[MetricType.cpu, MetricType.memory],
        Field(description="CPU or Memory metric type"),
    ]
    value: str = Field(min_length=1, max_length=50)


class NetworkMetric(BaseJobMetric):
    metric_type: Literal[MetricType.network]
    rx_bytes: str = Field(min_length=1, max_length=50)
    tx_bytes: str = Field(min_length=1, max_length=50)


JobMetricMetadataCreate = Annotated[
    ResourceMetric | NetworkMetric, Field(discriminator="metric_type")
]


class JobMetricMetadataDelete(BaseModel):
    metric_id: uuid.UUID
    metric_type: MetricType
