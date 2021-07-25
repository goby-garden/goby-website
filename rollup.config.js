const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const {terser} = require('rollup-plugin-terser');

module.exports = {
  input: 'src/_js/main.js',
  plugins: [resolve(), commonjs()],
  output: {
    file: 'dist/_js/bundle.js',
    format: 'iife',
    sourcemap: true,
    plugins: [terser()],
  },
};
