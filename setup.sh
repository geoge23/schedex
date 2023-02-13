echo "
VERACROSS_USERNAME=$(echo $VERACROSS_USERNAME)
VERACROSS_PASSWORD=$(echo $VERACROSS_PASSWORD)
MONGODB_URI=$(echo $MONGODB_URI)
" > /app/.env &&
cron &&
tail -f /var/log/cron.log