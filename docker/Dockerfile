ARG NAME=couchdb
ARG TAG=3.3.2
FROM ${NAME}:${TAG}

ENV TZ=Europe/UTC

COPY wrapper.sh /wrapper.sh
# set locals
# from: https://leimao.github.io/blog/Docker-Locale/
RUN apt update && apt-get install -y --no-install-recommends nginx python3 && chmod +x /wrapper.sh
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

# 5984: Main CouchDB endpoint
# 4369: Erlang portmap daemon (epmd)
# 9100: CouchDB cluster communication port
# 80: plover website
EXPOSE 80 443 5984 4369 9100
CMD ["/wrapper.sh"]
