FROM postgres:18-bookworm

LABEL maintainer="youness"
LABEL description="postgresql 18 based on debian bookworm"

RUN mkdir -p /docker-entrypoint-initdb.d/

COPY ./infra/config/postgres.conf /etc/postgresql/postgresql.conf

RUN chown -R postgres:postgres /docker-entrypoint-initdb.d

# Default port
EXPOSE 5432
