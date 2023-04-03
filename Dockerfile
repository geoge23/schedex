FROM node:latest

# copy the app's package.json and install dependencies
COPY package.json /app/package.json
WORKDIR /app
RUN npm install

# copy the app's code
COPY . /app

CMD ["npm", "start"]