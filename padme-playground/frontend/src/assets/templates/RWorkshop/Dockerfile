FROM r-base:4.1.0

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libcurl4-openssl-dev \
    libssl-dev

RUN R -e "install.packages(c('RPostgreSQL', 'httr'), repos='https://cloud.r-project.org/')"
WORKDIR /app
COPY main.R /app/main.R
CMD ["Rscript", "main.R"]
