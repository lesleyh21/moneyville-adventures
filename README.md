# Moneyville Adventures — Multiplayer Web Game

A real-time, room-code-based browser game for 2–5 players (designed for 4–5). Each player joins on a separate device. The server synchronizes turns, cards, dice, money, and the Bicycle Shop Savings Challenge.

## Run locally

1. Install Node.js 18 or later.
2. In this folder, run `npm install` and then `npm start`.
3. Open `http://localhost:3000` on the host computer.
4. For other devices on the same Wi-Fi, use `http://HOST-COMPUTER-LAN-IP:3000` (allow incoming connections through your firewall). Or deploy the folder to a Node.js hosting service with WebSocket support and share its HTTPS URL.

## Play

One person creates a room, shares its five-character code, and starts after players join. Players begin with $30, roll a 1–3 die, and draw from six category decks. The board has 40 spaces. At space 40, players below $100 stay at the Bicycle Shop and draw Earn Money cards on subsequent turns. The first successful purchase triggers an equal-turn finish; the highest savings balance among successful purchasers wins.

## Important notes

- This is a functional first version with a colorful digital board grid, not a pixel-perfect conversion of the illustrated board image. The original artwork cannot be used directly as a reliable clickable 40-space map because its space numbering is inconsistent.
- Rooms and scores are held in server memory and reset when the server restarts. Disconnects during a game are not yet recoverable; restart the room if a player drops out.
- No passwords or student accounts. Use first names or nicknames, and don't expose the game publicly without adding moderation/teacher controls and privacy review.
- Card text and values are editable in `server.js`. All dice rolls and money calculations happen on the server.
- To host online, use a service that runs Node.js and supports persistent WebSocket connections (static-only hosting is insufficient).
