ARG NAME=ubuntu
ARG TAG=22.04
FROM ${NAME}:${TAG}

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin

# set locals
# from: https://leimao.github.io/blog/Docker-Locale/
RUN apt update && apt-get install --no-install-recommends -y locales locales-all
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

USER root
RUN apt update && apt install -y git tox libgl1 libglib2.0-0 \
    libffi-dev pkg-config build-essential libpython3-dev libdbus-1-dev libglib2.0-dev
