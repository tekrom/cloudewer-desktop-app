const path = require('path');

const os = require('os');

const platform = os.platform();

const rootDir = path.join(__dirname,'page');
const indexHtml = path.join(rootDir, 'index.html');
const shortcutCaptureHtml = path.join(rootDir, 'shortcutCapture.html');

module.exports = {
  indexUrl:  `file://${indexHtml}`,
  shotcutUrl: `file://${shortcutCaptureHtml}`,
};