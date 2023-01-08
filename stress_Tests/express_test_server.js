const { application } = require('express');
const express = require('express');
const app = express();

app.ge
app.get('/', async (req, res) => {
    await res.send(`<h1>ALi is here </h1>`);
  })
app.get('/:lilo', async  (req, res) => {
 await  res.send(`<h1>ALi is here ${req.params.lilo}</h1>`);
});

app.get('/ali',  async (req, res) => {
  await res.send('<h1>ALi is here allllllllll</h1>');
});

app.post('/ali', async  (req, res) => {
  await res.send('<h1>ALi is here 111111</h1>');
});

app.get('/ali/:lilo', async  (req, res) => {
  await res.send(`<h1>ALi is here ${req.params.lilo}</h1>`);
});

app.get('/ali/:lilo/ali', async  (req, res) => {
 await  res.send(`<h1>ALi is here ${req.params.lilo} ali</h1>`);
});

app.get('/me',  async (req, res) => {
 await  res.send('||||||||||||||||||||||||||||||');
});

app.get('/me/:name',  async (req, res) => {
  await res.send(`||||||||||||||${req.params.name}||||||||||||||||`);
});

app.get('/me/ali',  async (req, res) => {
  await res.redirect('/ali');
});


app.listen(5500, () => console.log('Server listening on port 5500'));