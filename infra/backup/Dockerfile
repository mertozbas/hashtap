FROM alpine:3.19

RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    postgresql16-client \
    restic \
    tini \
    tzdata \
    dcron

ENV TZ=Europe/Istanbul

WORKDIR /opt/hashtap-backup

COPY backup.sh  /usr/local/bin/hashtap-backup
COPY restore.sh /usr/local/bin/hashtap-restore
COPY prune.sh   /usr/local/bin/hashtap-prune
COPY entrypoint.sh /entrypoint.sh
COPY crontab /etc/crontabs/root

RUN chmod +x /usr/local/bin/hashtap-backup \
             /usr/local/bin/hashtap-restore \
             /usr/local/bin/hashtap-prune \
             /entrypoint.sh

ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]
CMD ["cron"]
