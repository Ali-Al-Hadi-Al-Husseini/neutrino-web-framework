const Neutrino_pack = require('../build/Neutrino')
const Router = Neutrino_pack.Router
const Neutrino = Neutrino_pack.Neutrino


let app = new Neutrino(5500);

app.addroute("/<lilo>",async  (req, res) => {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts['lilo'] + ' </h1>');

});
app.addroute("/ali", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});

app.addroute("/ali/<lilo>", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + ' </h1>');
});
app.addroute("/ali/<lilo>/ali",async    (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + " ali" + ' </h1>');
});
app.addroute("/me", async   (req, res )=> {
    await res.sendHtml("||||||||||||||||||||||||||||||");

});
app.addroute("/me/<name>", async   (req, res )=> {
    await res.sendHtml("||||||||||||||" +req.dynamicParts['name'] + "||||||||||||||||");
});
app.addroute("/me/ali",  async  (req, res )=> {
    await res.redirect('/ali');
});
app.addroute('/halo', async  (req,res)=>{
    await res.render('index.html')
})

app.start()


