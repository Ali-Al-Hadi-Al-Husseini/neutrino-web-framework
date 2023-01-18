const Neutrino_pack = require('../build/Neutrino')
const Router = Neutrino_pack.Router
const Neutrino = Neutrino_pack.Neutrino
// const fs = require('fs');
// const helmet = require('helmet')


let app = new Neutrino(5500);



app.addRoute("/<lilo>",async  (req, res) => {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + ' </h1>');

});
app.addRoute("/ali", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});

app.addRoute("/ali/<lilo>", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + ' </h1>');
});
app.addRoute("/ali/<lilo>/ali",async    (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + " ali </h1>");
});

app.addRoute("/me", async   (req, res )=> {
    await res.sendHtml("||||||||||||||||||||||||||||||");
});

app.addRoute("/me/<name>", async   (req, res )=> {
    await res.sendHtml("||||||||||||||" +req.dynamicParts['name'] + "||||||||||||||||");
});
app.addRoute("/me/ali",  async  (req, res )=> {
    await res.redirect('/ali');
});
app.addRoute('/halo', async  (req,res)=>{
    await res.render("index.html")
})
let router = new Router(app,'/there',(req, res) => {
        res.sendHtml("<h1> there </h1>");
    })

router.addRoute("/<place>",(req, res ) => {
        res.sendHtml("<h1>there " + req.dynamicParts['place'] + "/h1>");
        res.end()
    })

app.addStaticPath("C:\\Users\\lilo\\Documents\\GitHub\\neutrino-web-framework\\tests\\static\\")
// app.addRateLimiting(10,60)
// app.enableLogging()
// app.addStrictSecruityMeasure()

app.start()


