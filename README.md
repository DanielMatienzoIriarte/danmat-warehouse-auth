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
MongoDB: Stores persistent user profiles (UUID user_id, hashed passwords, roles).

Redis: Manages session state, refresh token blacklisting, and temporary auth caching.