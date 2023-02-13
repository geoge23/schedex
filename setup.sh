echo "
VERACROSS_USERNAME=$(echo $VERACROSS_USERNAME)
VERACROSS_PASSWORD=$(echo $VERACROSS_PASSWORD)
MONGO_URI=$(echo $MONGO_URI)
" > /app/.env &&
cron &&
tail -f /var/log/cron.log