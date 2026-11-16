FROM node:24-bookworm-slim

LABEL maintainer="youness"
LABEL description="nest js image based on debian bookworm"

RUN apt-get update -y && apt-get install procps -y

RUN mkdir -p /app/project

WORKDIR /app/project

COPY app/package.json ./
# COPY app/package.json app/project/yarn.lock ./

RUN yarn install

COPY app ./

EXPOSE 3000

ENTRYPOINT [ "yarn" ]
CMD [ "start:dev" ]