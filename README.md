# graphql-kafka-payment-system

# GraphQL Kafka API Payment System

[![TypeScript](https://img.shields.io/badge/--3178C6?logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org)

A backend API service for a payments wallet.

Users can create account (includes an initial amount), transfer funds to another user's account and view their transaction history.

**This is a technical Assessment project.** This solution uses `Node.js` runtime, `GraphQL` for the API layer, `Redis` for user sessions, `MongoDB` for the database, `Kafka` for transaction events.

### GraphQL Resolvers

| Resolvers     | Description                                  |
| ------------- | -------------------------------------------- |
| account       | Gets authenticated user account information. |
| balance       | Gets authenticated user account balance.     |
| transactions  | Gets authenticated user transaction history  |
| login         | Logs in and authenticates users.             |
| createAccount | Registers and authenticates users.           |
| transfer      | Transfers funds to another user's account    |

## Requirements

Before getting started, make sure you have the following requirements:

- [Docker](https://www.docker.com)
- [Docker Compose](https://docs.docker.com/compose/) (Supporting compose file version 3)
- A [bash](https://www.gnu.org/software/bash) compatible shell

### Run The Project

Follow these steps to get your development environment set up:

1. **Clone this repository** locally;

```bash
# Change to the desired directory
$ cd <desired-directory>

# Clone the repo
$ git clone https://github.com/evanigwilo/graphql-kafka-payment-system.git

# Change to the project directory
$ cd graphql-kafka-payment-system
```

2. Change environmental variables filename from `.env.example` to `.env`

3. In the backend directory, update the `.env` file values for the following variables:

```bash
# Kafka configurations
KAFKA_SERVER=
KAFKA_CLUSTER_API_KEY=
KAFKA_CLUSTER_API_SECRET=
```

4. At the root directory **graphql-kafka-payment-system**, run the following command:

```bash
# Create external docker volume for the mongo database
$ docker volume create mongo-db-volume

# Build and run backend in a container environment
$ docker-compose --env-file .env -p payment-system-stack -f docker-compose.yml up --build -d
```

5. The api-server will be running at http://localhost:4000/v1

## Useful commands

```bash
# Stops and removes containers, networks and volumes
$ docker-compose --env-file .env -p payment-system-stack -f docker-compose.yml down -v --remove-orphans
```

## References

> [Confluent Docs](https://docs.confluent.io/home/overview.html/)
