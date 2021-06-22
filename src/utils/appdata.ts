import path from 'path';

export function appData(...app: string[]) {
  let dataFolder: string = '';

  if (process.platform === 'win32') {
    dataFolder = path.join(process.env.APPDATA, ...app);
  } else if (process.platform === 'darwin') {
    dataFolder = path.join(process.env.HOME, 'Library', 'Application Support', ...app);
  } else {
    dataFolder = path.join(process.env.HOME, ...prependDot(...app));
  }
  return dataFolder;
}

function prependDot(...app: string[]) {
  return app.map((item, i) => {
    if (i === 0) {
      return `.${item}`;
    } else {
      return item;
    }
  });
}
