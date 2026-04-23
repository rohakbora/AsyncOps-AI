FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=builder /root/.local /home/appuser/.local
COPY worker.py .
ENV PATH=/home/appuser/.local/bin:$PATH
USER appuser
CMD ["python", "worker.py"]
