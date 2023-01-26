const { application } = require('express');
const express = require('express');
const app = express();

app.ge
app.get('/',  (req, res) => {
     res.send(`<h1>ALi is here </h1>`);
  })
app.get('/:lilo',   (req, res) => {
   res.send(`<h1>ALi is here ${req.params.lilo}</h1>`);
});

app.get('/ali',   (req, res) => {
   res.send('<h1>ALi is here allllllllll</h1>');
});

app.post('/ali',   (req, res) => {
   res.send('<h1>ALi is here 111111</h1>');
});

app.get('/ali/:lilo',   (req, res) => {
   res.send(`<h1>ALi is here ${req.params.lilo}</h1>`);
});

app.get('/ali/:lilo/ali',   (req, res) => {
   res.send(`<h1>ALi is here ${req.params.lilo} ali</h1>`);
});

app.get('/me',   (req, res) => {
   res.send('||||||||||||||||||||||||||||||');
});

app.get('/me/:name',   (req, res) => {
   res.send(`||||||||||||||${req.params.name}||||||||||||||||`);
});

app.get('/me/ali',   (req, res) => {
   res.redirect('/ali');
});


app.listen(5500, () => console.log('Server listening on port 5500'));