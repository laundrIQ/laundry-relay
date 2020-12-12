FROM node:current
WORKDIR /app
COPY . /app
RUN npm install

CMD ["npm", "start"]