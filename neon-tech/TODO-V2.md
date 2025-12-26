# TODO V2: Multiplayer (WebSocket, Authoritative Server)

## Architecture Outline

### Server (Node.js + ws)
- Authoritative simulation loop at fixed 60 ticks.
- Maintain world state (players, bots, bullets, pickups, extraction).
- Validate client inputs and apply reconciliation.
- Broadcast snapshots (delta or full) at 20-30 Hz.

### Client
- Prediction for local player movement + shooting.
- Server reconciliation with input buffer.
- Interpolation for remote players and bots.
- Lag compensation for hit detection.

## Data Flow

1. Client sends input frames `{ tick, move, aim, shoot, ability }`.
2. Server simulates and resolves collisions/hits.
3. Server sends snapshot `{ tick, entities, bullets, events }`.
4. Client reconciles local state, replays pending inputs.

## Security / Anti-cheat
- Server-side hit validation.
- Rate limiting on inputs per tick.
- Sanitize player names and loadout selections.

## Persistent Profile
- Server-side profile storage for credits and upgrades.
- Secure session tokens.

## Deployment
- Stateless lobby server, multiple match servers.
- Basic NAT traversal for voice (optional).
