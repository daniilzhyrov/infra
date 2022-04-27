FROM node:14

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENTRYPOINT [ "npm start" ]

EXPOSE 8888