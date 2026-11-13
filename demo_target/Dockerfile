# BharatBank Assist (demo target). Build context: demo_target/
#   docker build -t bharatbank-demo demo_target
# Required env: SARVAM_API_KEY. Recommended on a public host: DEMO_TARGET_API_KEY (then add the header
# `x-demo-key: <value>` in the Chakravyuh target) and CHAKRAVYUH_VERIFY_TOKEN (the token shown on the target page).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

RUN pip install --no-cache-dir "fastapi>=0.115" "uvicorn[standard]>=0.30" "httpx>=0.27"

COPY app.py .
COPY prompts ./prompts

EXPOSE 8100
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8100}"]
