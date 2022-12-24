const Neutrino_pack = require('./neutrino')

const Router = Neutrino_pack.Router
const Neutrino = Neutrino_pack.Neutrino


let app = new Neutrino(5500);

 function setup_Server(){

    app.addroute("/<lilo>", (re, res, dynamicpar) => {
        res.write("<h1>ALi is  here " + dynamicpar["lilo"] + ' </h1>');
    });
    app.addroute("/ali",  (req, res )=> {
        res.write("<h1>ALi is  here" + "alllllllll" + ' </h1>');
    });

    app.addroute("/ali/<lilo>",  (req, res,dynamic )=> {
        res.write("<h1>ALi is  here " + dynamic["lilo"] + ' </h1>');
    });
    app.addroute("/ali/<lilo>/ali",  (req, res,dynamic )=> {
        res.write("<h1>ALi is  here " + dynamic["lilo"] + " ali" + ' </h1>');
    });
    app.addroute("/me",  (req, res,dynamic )=> {
        res.write("||||||||||||||||||||||||||||||");
    });
    app.addroute("/me/<name>",  (req, res,dynamic )=> {
        res.write("||||||||||||||" +dynamic['name'] + "||||||||||||||||");
    });
    app.addroute("/me/ali",  (req, res,dynamic )=> {
        res.redirect('/ali');
    });
    let router = new Router(app,'/there',(req, res, dynamicpar) => {
            res.write("<h1> there </h1>");
        })

    // "<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>'
    router.addRoute("/<place>",(req, res,dynamic ) => {
            res.write("<h1>there " + dynamic['place'] + "/h1>");
        })
    
    app.addStaticPath('C:\\Users\\lilo\\Documents\\GitHub\\neutrino-web-framework\\src\\static')


    // app.use((req, res,next)=> {
    //     console.log("===================    middleware acssecd here hola hola hola hello    =====================")
    // })
     app.start()
}

setup_Server()
