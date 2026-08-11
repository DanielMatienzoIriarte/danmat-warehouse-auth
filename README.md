<h1 align="center">Point of Authorization and Authentication <br>-Auth Service-</h1>

# Overview

## Introduction

The absolute authority on identity, session management, and credential verification

### Key Responsibilities:

Credential Handling: Manages registration, encrypted login, and user role validation (Admin/Client).

Token Minting: Uses the Private Key (Asymmetric RS256) to sign and issue new JWTs.

Token Rotation: Handles refresh token logic and manages the lifecycle of credentials.

## Requirements

1. <a href="https://nodejs.org/en/download/">Node Js</a>
2. <a href="https://fastify.dev/docs/latest/">Fastify</a>
3. <a href="https://www.getpostman.com/">Postman</a>
4. Web Server (ex. localhost)

## AUTH Microservice (Fastify)

Port: 4001.

## MongoDB

Stores persistent user profiles (UUID user_id, hashed passwords, roles).

MongoDB’s configuration file uses YAML syntax, spaces (not tabs) must be used when editing it. You can view the file’s current contents with:
```sudo cat /etc/mongod.conf```

This section defines where MongoDB stores its data:
```
storage:
  dbPath: /var/lib/mongodb
```
This is the directory where MongoDB stores its databases, collections, and indexes. By default, it points to /var/lib/mongodb. If you change this path, make sure the directory exists and is owned by the mongodb user:

```
sudo mkdir -p /data/mongodb
sudo chown -R mongodb:mongodb /data/mongodb
```

## Redis

Manages session state, refresh token blacklisting, and temporary auth caching.