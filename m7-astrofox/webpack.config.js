const view = require('./webpack.config.view.js');
const main = require('./webpack.config.main.js');
const preload = require('./webpack.config.preload');

module.exports = [view, main, preload];
