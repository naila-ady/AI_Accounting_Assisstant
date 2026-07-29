FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --frozen

COPY app/ ./app/
COPY alembic.ini alembic/ ./

EXPOSE 8000

COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
