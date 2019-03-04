FROM eu.gcr.io/neo9-catalogue/node:nexus-yarn-10.12

COPY ./ ./
RUN yarn run build

ENV PORT 8014
ENV NODE_ENV "development"

CMD ["node", "dist/index.js"]
