import path from 'path';
import fs from 'fs';

export const isDirectory = (dest) => {
  try {
    const stats = fs.statSync(dest);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
};

export const isFile = (dest) => {
  try {
    const stats = fs.statSync(dest);
    return stats.isFile();
  } catch (err) {
    return false;
  }
};

export const ensureDirectory = (dest) => {
  if (!isDirectory(dest)) {
    fs.mkdirSync(dest, {
      recursive: true,
    });
  }
};

export const copyFile = (src, dest) =>
  new Promise((resolve) => {
    const readStream = fs.createReadStream(src);

    readStream.on('error', err => resolve({
      err,
      src,
      dest,
    }));

    readStream.on('end', () => resolve({
      src,
      dest,
    }));

    readStream.pipe(fs.createWriteStream(dest));
  });

export const copyFolder = (src, dest) =>
  new Promise(async (resolve) => {
    ensureDirectory(dest);
    await Promise.all(fs.readdirSync(src)
      .map((name) => {
        const srcPath = path.join(src, name);
        const destPath = path.join(dest, name);
        if (isDirectory(srcPath)) {
          return copyFolder(srcPath, destPath);
        }

        return copyFile(srcPath, destPath);
      }));
    resolve({
      src,
      dest,
    });
  });

export const safeReaddirSync = (dir) => {
  try {
    const files = fs.readdirSync(dir);
    return files || [];
  } catch (err) {
    return [];
  }
};
