## Bug Report

[x] **Invalid Email/Password Error**: Fixed a critical bug where `signIn` failed due to inconsistent `scrypt` hashing behavior between the runtime and the bundled code. The issue was caused by `util.promisify(scrypt)` compatibility issues in Bun's Node compatibility layer when building for Node targets. Replaced with a manual Promise wrapper to ensure consistent hash generation.
[]
