## Changelogs

- **Version 0.0.1:**
  This initial version introduced the basic auth with email and password storing the database to the postgresql via the pool.

- **Version 0.0.2:**
  - **Changes:**
    1. **Session Signing**: Implemented HMAC-SHA256 signing for session IDs using the `secret`. Tokens are now tamper-proof and `validateSession` performs a stateless signature check before database lookup.
    2. **Secret Validation**: Added a console warning if the provided `secret` is shorter than 32 characters to encourage secure environments.
  - **Bug found:**
    [x] **Invalid Email/Password Error**: Fixed a critical bug where `signIn` failed due to inconsistent `scrypt` hashing behavior between the runtime and the bundled code. The issue was caused by `util.promisify(scrypt)` compatibility issues in Bun's Node compatibility layer when building for Node targets. Replaced with a manual Promise wrapper to ensure consistent hash generation.

- **Version 0.0.3:**
  - **Changes:**
    1. **MongoDB Adapter**: Added support for MongoDB as a database adapter, allowing users to store user data and sessions in a MongoDB database.
    2. **MongoDB Types**: Added MongoDB-specific types to the codebase, including `MongoDatabase` and `MongoSession` interfaces.
