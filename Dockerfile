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
ADD crontab /etc/cron.d/crontab

# give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/crontab

# create log for cron
RUN touch /var/log/cron.log

# run the command on container startup
CMD cron && tail -f /var/log/cron.log