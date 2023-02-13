# a docker image that runs a nodejs app once per week

FROM node:latest

# install cron
RUN apt-get update && apt-get install -y cron

# copy the app's package.json and install dependencies
COPY package.json /app/package.json
WORKDIR /app
RUN npm install

# copy the app's code
COPY . /app

# copy the cron job
COPY cronjob /etc/cron.d/cronjob

# give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/cronjob

# apply cron job
RUN crontab /etc/cron.d/cronjob

# run the command on container startup
CMD cron && tail -f /var/log/cron.log