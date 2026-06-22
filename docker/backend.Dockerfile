# syntax=docker/dockerfile:1

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Heavy ML deps — layer cached until requirements-ml.txt changes
COPY apps/backend/requirements-ml.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-ml.txt \
    --index-url https://download.pytorch.org/whl/cpu \
    --extra-index-url https://pypi.org/simple

# App deps — layer cached until requirements-base.txt changes
COPY apps/backend/requirements-base.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-base.txt

COPY apps/backend .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
