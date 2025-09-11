FROM python:3.8
COPY api_mocker api_mocker
COPY integration_t.py integration_test.py
RUN pip install tornado
CMD python3 integration_test.py