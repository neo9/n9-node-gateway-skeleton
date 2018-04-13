FROM repo.neo9.pro:9999/node:lts

COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY ./ ./
RUN yarn run build

ENV PORT 8014
ENV NODE_ENV "development"

CMD ["node", "dist/index.js"]
