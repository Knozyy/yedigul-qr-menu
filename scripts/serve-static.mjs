// public_html'i paylaşımlı hosting gibi statik servis eder (yerel test için)
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(join(__dirname, '..', 'public_html')));
const port = Number(process.env.PORT) || 8090;
app.listen(port, () => console.log(`public_html http://localhost:${port}`));
