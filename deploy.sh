IMAGE="evergiven.ury.york.ac.uk:5000/rosesyt"
CONTAINER="rosesyt"
PROJECTDIR="/opt/rosesyt"
LOGDIR="/mnt/logs/"
PORT=5047
DATE=$(date +%s)

docker build -t $IMAGE:$DATE .
docker push $IMAGE:$DATE
docker service update --image $IMAGE:$DATE rosesyt
