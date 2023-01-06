const Neutrino_pack = require('../build/Neutrino')
const Router = Neutrino_pack.Router
const Neutrino = Neutrino_pack.Neutrino
// const fs = require('fs');
// const helmet = require('helmet')


let app = new Neutrino(5500);



app.addroute("/<lilo>",async  (req, res) => {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + ' </h1>');

});
app.addroute("/ali", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});
// app.post('/ali',(req, res )=> {
//     res.sendHtml("<h1>ALi is  here" + "111111" + ' </h1>');
// })

app.addroute("/ali/<lilo>", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + ' </h1>');
});
app.addroute("/ali/<lilo>/ali",async    (req, res )=> {
    await res.sendHtml("<h1>ALi is  here " + req.dynamicParts["lilo"] + " ali" + ' </h1>');
});
app.addroute("/me", async   (req, res )=> {
    await res.sendHtml("||||||||||||||||||||||||||||||");
    app.addroute('/me', async  (req, res)=>{
        await res.sendHtml("<h1>changed</h1>");
        app.addroute('/me', async  (req, res)=>{
            await res.sendHtml("<h1>changed 2 </h1>");
        })
    })
});
app.addroute("/me/<name>", async   (req, res )=> {
    await res.sendHtml("||||||||||||||" +req.dynamicParts['name'] + "||||||||||||||||");
});
app.addroute("/me/ali",  async  (req, res )=> {
    await res.redirect('/ali');
});
app.addroute('/halo', async  (req,res)=>{
    await res.render("C:\\Users\\lilo\\Documents\\GitHub\\neutrino-web-framework\\tests\\static\\index.ejs")
})
let router = new Router(app,'/there',(req, res) => {
        res.sendHtml("<h1> there </h1>");
    })

// "<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>'
router.addRoute("/<place>",(req, res ) => {
        res.sendHtml("<h1>there " + req.dynamicParts['place'] + "/h1>");
        res.end()
    })

// app.addStaticPath('C:\\\\UserL\\\\lilo\\\\Documents\\\\GitHub\\\\neutrino-web-framework\\\\src\\\\static')
// app.addRateLimiting(10,60)
// app.enableLogging()
// app.addStrictSecruityMeasure()

app.start()


