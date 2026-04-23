# syntax=docker/dockerfile:1.7
# Sidecar that runs pg_dump + uploads tar on a cron schedule, prunes old
# snapshots, and (optionally) copies them off-site via a user-supplied
# POST_BACKUP_CMD. Base image already ships pg_dump 17 + busybox crond.
FROM postgres:17-alpine

# rclone = generic remote upload (s3, gcs, sftp, etc). Users that don't
# need it just leave POST_BACKUP_CMD unset and the binary stays idle.
RUN apk add --no-cache rclone tini

COPY entrypoint.sh /entrypoint.sh
COPY runner.sh /usr/local/bin/backup-runner.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/backup-runner.sh

ENV BACKUP_SCHEDULE="0 3 * * *" \
    RETAIN_DAYS=14 \
    BACKUP_DIR=/data/backups \
    UPLOADS_DIR=/data/uploads \
    PGHOST=postgres

ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]
