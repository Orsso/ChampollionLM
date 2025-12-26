docker compose --profile prod down 

git pull 

docker compose --profile prod up -d --build 
