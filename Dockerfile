# Use an official Node.js runtime as a parent image
FROM node:alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install && npm install typescript -g

# Copy the rest of your application code
COPY . .

# Expose the port your app will run on
EXPOSE 7000

# Command to run your app
RUN npm run build

CMD [ "npm", "start", "dist/app.js" ]