# backend/Dockerfile
FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev git curl && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir \
    "cognee>=0.5.5,<0.6.0" \
    "rdflib>=7.0.0,<8.0.0" \
    "supabase>=2.0.0" \
    "uvicorn[standard]>=0.30.0" \
    "fastapi>=0.115.0"

COPY . .

ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
