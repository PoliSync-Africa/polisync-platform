# POLISYNC AFRICA Backend

Enterprise-grade political technology platform for Africa.

## Features

- Authentication
- Elections
- Results Collation
- Country Engine
- SupportOS
- Live Dashboard

## Tech Stack

- Node.js
- Express
- MongoDB
- JWT
- Mongoose

## Installation

```bash
npm install
```

Create `.env` from `.env.example`.

Run:

```bash
npm run dev
```

## API

### Authentication

POST `/auth/register`

POST `/auth/login`

### Elections

GET `/elections`

POST `/elections/create`

### Results

GET `/results/dashboard`

POST `/results/submit`

### Admin

GET `/admin/countries`

POST `/admin/countries`

## License

Copyright © POLISYNC AFRICA
