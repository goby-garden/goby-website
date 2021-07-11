const express = require('express');
const app = express();

// javascript compilation
const rollup = require('rollup');
const inputOptions = {
  'input':'js/function.js'
};
const outputOptions = {
  'format':'iife',
  'file':'_site/js/function.js'
};





app.use(express.static('_site'));

// app.get('/', (req, res) => {
//   res.send('Hello World!!');
// });

const server = app.listen(7000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
