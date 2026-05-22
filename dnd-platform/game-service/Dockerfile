FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o /bin/game-service .

FROM alpine:3.20
COPY --from=build /bin/game-service /bin/game-service
EXPOSE 8080
ENTRYPOINT ["/bin/game-service"]
