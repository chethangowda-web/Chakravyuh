# Chakravyuh API. Build context: backend/
#   docker build -t chakravyuh-api backend
#   docker run -p 8010:8010 --env-file backend/.env -v chakravyuh-data:/app/data chakravyuh-api
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts

# SQLite + audio live here: mount a persistent volume at /app/data or data resets on every deploy.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8010
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010}"]
