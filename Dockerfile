FROM repo.neo9.pro:9999/node/nexus-yarn:8.11

COPY ./ ./
RUN yarn run build

ENV PORT 8014
ENV NODE_ENV "development"

CMD ["node", "dist/index.js"]
