const Neutrino_pack = require('./Neutrino')
const Router = Neutrino_pack.Router
const Neutrino = Neutrino_pack.Neutrino
// const fs = require('fs');
// const helmet = require('helmet')


let app = new Neutrino(5500);



app.addroute("/<lilo>",async  (req, res, dynamicpar) => {
    await res.sendHtml("<h1>ALi is  here " + dynamicpar["lilo"] + ' </h1>');

});
app.addroute("/ali", async   (req, res )=> {
    await res.sendHtml("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});
// app.post('/ali',(req, res )=> {
//     res.sendHtml("<h1>ALi is  here" + "111111" + ' </h1>');
// })

app.addroute("/ali/<lilo>", async   (req, res,dynamic )=> {
    await res.sendHtml("<h1>ALi is  here " + dynamic["lilo"] + ' </h1>');
});
app.addroute("/ali/<lilo>/ali",async    (req, res,dynamic )=> {
    await res.sendHtml("<h1>ALi is  here " + dynamic["lilo"] + " ali" + ' </h1>');
});
app.addroute("/me", async   (req, res,dynamic )=> {
    await res.sendHtml("||||||||||||||||||||||||||||||");
    app.addroute('/me', async  (req, res,dynamic)=>{
        await res.sendHtml("<h1>changed</h1>");
        app.addroute('/me', async  (req, res,dynamic)=>{
            await res.sendHtml("<h1>changed 2 </h1>");
        })
    })
});
app.addroute("/me/<name>", async   (req, res,dynamic )=> {
    await res.sendHtml("||||||||||||||" +dynamic['name'] + "||||||||||||||||");
});
app.addroute("/me/ali",  async  (req, res,dynamic )=> {
    await res.redirect('/ali');
});
app.addroute('/halo', async  (req,res,dynamicpar)=>{
    await res.render('C:\\Users\\lilo\\Documents\\GitHub\\neutrino-web-framework\\src\\static\\index.ejs')
})
let router = new Router(app,'/there',(req, res, dynamicpar) => {
        res.sendHtml("<h1> there </h1>");
    })

// "<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>'
router.addRoute("/<place>",(req, res,dynamic ) => {
        res.sendHtml("<h1>there " + dynamic['place'] + "/h1>");
        res.end()
    })

// app.addStaticPath('C:\\UserL\\lilo\\Documents\\GitHub\\neutrino-web-framework\\src\\static')
// app.addRateLimiting(10,1)
// app.enableLogging()
// app.addStrictSecruityMeasure()

app.start()


