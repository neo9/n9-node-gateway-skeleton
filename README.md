# N9 NODE GATEWAY SKELETON

## Start it locally with

```bash
git clone https://github.com/neo9/n9-node-microservice-skeleton.git
cd n9-node-microservice-skeleton
docker-compose build

docker network create backend
docker-compose up
```

Then go to :

- `localhost:8080/`
- `localhost:8080/ping`
- `localhost:8080/documentation/`
- `localhost:8080/ecrm` → return a 401
