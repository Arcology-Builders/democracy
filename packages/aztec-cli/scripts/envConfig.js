import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const dotenvFile = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvFile)) {
  dotenv.config({ path: dotenvFile });
}
