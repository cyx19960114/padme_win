FROM python:3.11-slim-bookworm

# Switch working directory
WORKDIR /usr/src/app

# Copy the requirements file into the image
COPY src requirements.txt ./

# Install the dependencies and packages in the requirements file
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5001

# Configure the container to run in an executed manner
ENTRYPOINT [ "python" ]

CMD ["app.py" ]
