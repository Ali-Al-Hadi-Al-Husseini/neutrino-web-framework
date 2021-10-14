const http = require("http");
const fs = require('fs');


/* 

    START OF CONSTANTS 

*/
const IncomingMessage = http.IncomingMessage;
const ServerResponse  = http.ServerResponse;


/*

    PAGES404 IS THE DEFAUKT RESULT THAT WILL APPEAR 
    IF THE ROUTE THAT WAS ENTRED BY THE USER DOESN'T
    EXIST 

*/
let page404 = `    <div style=" display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        height: 100%;"
                        >
                        <div style=" font-size:100px;
                            display:block;"
                            >
                            404
                            </div>
                        <br>
                        <div style="display: block;
                        font-size:100px;">  
                        Page Not Found
                        </div>
                        </div>` 
/*

    END OF CONSTANS

*/


/*

    START OF ROUTE CLASS

    THE ROUTE CLASS SAVES THE ROUTES AND GIVES US 
    THE ABILITY FOR THR ROUTES TO BE A TREE STRUCUTRE
    SO WE COULD OPTIMIZE THE TIME NEEDED TO SEARCH
    FOR A SPECFIC ROUTE 

*/

class Route{
    parent:any;
    children: Route[];
    func: Function;
    methods: string[];
    route:string;
    fullName:string;
    dynamic:boolean;
    dynamicRoute:any;

    // dynamicVar:string;

    constructor(route:string, func:Function=(req:any,res:any)=>{res.write(page404)},methods:string[]=["GET"]){

        this.parent = null;
        this.children = [];
        this.func = func;
        this.route = route;
        this.methods = methods;
        this.fullName = route;
        this.dynamic = route[1] === '<' ? true : false
        this.dynamicRoute= null;
            

    }
    // ADDS A CHILD TO THE CURRENT ROUTE INTANCE 
    addChild(child:Route){
        if(child.route[1] === '<'){
            this.dynamicRoute = child;

        }else{
            child.setParent(this)

           } 
    }
    // SETS THE  PARENT TO THE CURRENT ROUTE INTANCE 
    setParent(parent: Route){
        this.parent = parent;
        this.setFullRoute(parent.fullName + this.route)
        parent.children.push(this)
    }
    setFullRoute(route:string){
        this.fullName = route;
    }
    setDynamicRoute(route:Route){
        route.parent = this
        route.setFullRoute(this.fullName + route.route)
        this.dynamicRoute = route
    }
    /*
        THIS METHODS TAKES A ROUTE(URL) AND THEN 
        PARSES THREW IT TO GET THE DYNAMIC PARTS IN IT
        AND TO CHECK IF THE INPUT  IS  THE SAME AS
        THIS ISTANCE ROUTE
     */
    compareRoutes(route:string){
        let urls = route.split('/');
        let dynamicParts:any = {};
        
        urls = urls.filter(element => element != '' )

        let curr:Route = this;
        let lastIsDynamic = false;
        for (let url of urls) {
            url = '/' + url;
            for (const child of curr.children) {
                if (child.route === url || child.route + "/" === url   ) {
                    curr = child;
                    break;
                }
            }
            if ((url != curr.route && curr.route + "/" != url   )&& curr.dynamicRoute != null) {
                curr = curr.dynamicRoute;
                dynamicParts[curr.route.slice(2, curr.route.length - 1)] = url.slice(1);
                lastIsDynamic = true;
            }
            else {
                lastIsDynamic = false;
            }
        }
        if ((curr.fullName === route || curr.fullName  + '/'=== route )|| lastIsDynamic) {
            return [curr, dynamicParts];
        }
        return [null, null];
}    
}


/*

    END OF ROUTE CLASS

*/


/*

    START OF RESPONSE AND REQUEST CLASS

*/
class _Response extends http.ServerResponse{
    _req:any
    constructor(response:typeof ServerResponse,request:typeof IncomingMessage){
        super(request)
        this._req = response
    }

}
class _Request extends http.IncomingMessage{

    _req:any;
    params:any;
    app:Neutrino;
    ip:string;
    path:string;
    cookies:any;

    constructor(request:typeof IncomingMessage,app:Neutrino){

        super(request.socket)
        this.app = app;
        this._req = request;
        this.params = {};
        this.ip = this._req.socket.remoteAddress;
        this.cookies = this.parseCookies;

        let url = this._req.url.split('?');

        this.path = url[0];

        //THIS LOOP EXTRACTS THE PARAMETER FROM THE URL
        if (url[0] != this._req.url){
            let params = url[1].split('&');
            for(let param of params){

                let [varName, value] = param.split('=');
                this.params[varName] = value;

        }}

    }
    /* 
        THIS METHODS PARSERS THRE COOKIES AND 
        RETURN A DICTIONART WITH THE KEYS
        AS COOKIES NAMES AND VALUES AS COOKIES VALUES
    */
    parseCookies () {
        let list:any = {},
            rc = this._req.headers.cookie;
        rc && rc.split(';').forEach(function( cookie:string ) {
            let parts:string[] = cookie.split('=');
            let newParts:string[] = [];
            if(parts.length < 2 ){
                
                for(let i = 0; i < (parts.length -1) ; i++){
                    newParts[0] += parts[i]
                }
                newParts[1] =  parts[parts.length-1];
            }else{
                newParts = parts
            }
            list[newParts[0]] = decodeURI(parts[1]);
        });
    
        return list;
    }
    //GET INFO FROM HEADERS
    get(input:string){
        return this.headers[input]
    }
}   

/*

    END OF RESPONSE AND REQUEST CLASSES

*/


/*

    START OF ROUTER CLASS

    THIS CLASS GIVE THE ABBILITY TO SEPRATE THE VIEWS
    OF THE APP INTO COUPLE OF DIFFERENT FILES
    AND SHOTENS THE NEEDED ROUTE TO BE WRITTE

*/
class Router{
    _mainRoute: Route;
    _app: Neutrino;

    constructor(app:Neutrino,mainRoute:string, routeFunc:Function=(req:any,res:any)=>{res.write(page404)},methods:string[]=["GET"]){

        this._app = app;
        let lastFound = this._app.findLastCommon(mainRoute,this._app._route)
        this._mainRoute = this._app.continueConstruction(lastFound,mainRoute)
        
        this._mainRoute.func = routeFunc
        this._mainRoute.methods = methods
        

    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)   

    */
    findLastCommon(route:string,mainRoute:Route){
        let urls  = route.split("/");
        let curr = mainRoute;


        for(let url of urls){
            url  = '/' + url
            for(const child of curr.children){
                if (child.route === url){
                    curr = child
                    break
                }
            }
            if(url != curr.route && curr.dynamicRoute != null){
                curr = curr.dynamicRoute
            }

        }
        return curr
        }
    
    // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute:Route,url:string){

        const lastFoundidx = lastRoute.fullName.split('/').length;
        let urls = url.split('/');
        urls = urls.splice(lastFoundidx,urls.length);
        let curr = lastRoute;

        for(const route of urls){
            if(route[0] == "<"){
                let newRoute = new Route("/" + route);
                curr.setDynamicRoute(newRoute)
                curr = newRoute

            }else{
                let newRoute = new Route("/" + route);
                curr.addChild(newRoute);
                curr = newRoute;
            }
        }   
        return curr
    }
    
    // ADD ROUTES TO THE MAIN ROUTER
    addRoute(url:string,routeFunc:Function,methods:string[]=["GET"]){
        url = this._mainRoute.fullName + url
        const urls = url.split('/');

        if(urls.length <= 2 && urls[1][0] == '<'){

            this._mainRoute.dynamicRoute = new Route("/"+urls[1],routeFunc,methods)
            this._mainRoute.dynamicRoute.setParent(this._mainRoute)

        // }else if(urls.length <= 2){
        //     let newMainRoute = new Route(url,routeFunc,methods);
        //     this._mainRoute.addChild(newMainRoute);

        }else{
            let mainRoute = this._mainRoute;
        
            if (mainRoute != null){
                let lastCommonRoute = this.findLastCommon(url,mainRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute,url);

                finalRoute.func = routeFunc
                finalRoute.methods = methods
            
            }else{

                let lastCommonRoute = this.findLastCommon(url,this._mainRoute.dynamicRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute,url);

                finalRoute.func = routeFunc
                finalRoute.methods = methods
                this._mainRoute.dynamicRoute.addChild(finalRoute)

            }
    }
    }
}
  


/*

    START OF MAIN CLASS(NEUTRINO)

*/
class Neutrino{
    _server;
    _port:number;
    _route:Route;
    _routesobjs: any;
    _default404:string;
    _mainDynammic:any;
    constructor(port: number){
        
        this._server = http.createServer();
        this._port   = port;
        this._route = new Route('',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")});
        this._mainDynammic = null;
        this._routesobjs = {
                            '/': new Route('/',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")})
                        }
        
        this._default404 = `    <div style=" display: flex;
                                    justify-content: center;
                                    align-items: center;
                                   width: 100%;
                                    height: 100%;"
                                    >
                                <div style=" font-size:100px;
                                        display:block;"
                                        >
                                        404
                                        </div>
                                <br>
                                <div style="display: block;
                                    font-size:100px;">  
                                Page Not Found
                                </div>
                            </div>` 

    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)   

    */
    findLastCommon(route:string,mainRoute:Route){
        let urls  = route.split("/");
        let curr = mainRoute;


        for(let url of urls){
            url  = '/' + url
            for(const child of curr.children){
                if (child.route === url){
                    curr == child
                    break
                }
            }
            if(url != curr.route && curr.dynamicRoute != null){
                curr = curr.dynamicRoute
            }

        }
        return curr
        }
    
     // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute:Route,url:string){

        const lastFoundidx = lastRoute.fullName.split('/').length;
        let urls = url.split('/');
        urls = urls.splice(lastFoundidx,urls.length);
        let curr = lastRoute;

        for(const route of urls){
            if(route[0] == "<"){
                let newRoute = new Route("/" + route);
                curr.setDynamicRoute(newRoute)
                curr = newRoute

            }else{
                let newRoute = new Route("/" + route);
                curr.addChild(newRoute);
                curr = newRoute;
            }
        }   
        return curr
    }
    // ADDS ROUTES OBJECT TO THE TREE
    addroute(url: string, routeFunc:Function,methods: string[]= ["GET"]):void{

        const urls = url.split('/');

        if(urls.length <= 2 && urls[1][0] == '<'){

            this._mainDynammic = new Route(urls[1],routeFunc,methods)

        }else if(urls.length <= 2){
            let newMainRoute = new Route(url,routeFunc,methods);
            this._route.addChild(newMainRoute);

        }else{
            let mainRoute = this._route;
        
            if (mainRoute != null){
                let lastCommonRoute = this.findLastCommon(url,mainRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute,url);

                finalRoute.func = routeFunc
                finalRoute.methods = methods

            }else{

                let lastCommonRoute = this.findLastCommon(url,this._mainDynammic);
                let finalRoute = this.continueConstruction(lastCommonRoute,url);

                finalRoute.func = routeFunc
                finalRoute.methods = methods
                this._mainDynammic.addChild(finalRoute)

            }
    }

    }
    // READS HTML FILE AND GIVES THE OUT AND CHANGES THE HEAD OF THE RESPONSE
    readhtmlfile(path: string,res:any){

        try{
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            const data = fs.readFileSync(path,'utf8')
            return data
        }catch (error){
            throw error
        }
        
    }
    // THIS METHODS CHANGES THE DEFAULT 404
    set404(html:string){
        this._default404 = html;
    }
    // THIS IS THE MAIN FUNCTION THAT START THE SERVER
    start(port: number = this._port) {
        
        let _this = this;
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at https://127.0.0.1:" + this._port)

        // THE ON METHODS GIVES US THE ABILITY TO EXECUTE A FUNCTION WHEN A REQUEST IS RECIEVED
        this._server.on('request', (request:any, response:any) => {


            let url:string = request.url;
            let possibleParams = url.split('?');
            const _request = new _Request(request,app)

            if(possibleParams[0] != url){
                url = possibleParams[0];
            }

            const method = request.method;
            console.log("Got a " + method + " request on " + url);


            const mainRoute = this._route
            const found  = mainRoute.compareRoutes(url)
            const urlObj= found[0];
            const dynamicVars = found[1] ;


      
            if ( urlObj != null){

                if(urlObj.methods.includes(method)){
                
                    if (urlObj.dynamic){
                        
                        try{

                            urlObj.func(_request,response,dynamicVars)
                            response.statusCode = 200;
                            response.end()
                            console.log("reponse sent to " + request.socket.remoteAddress)

                        }catch(err){

                            response.statusCode = 500;
                            response.end()
                        }

                    }else {
                        try{

                            urlObj.func(_request,response)
                            response.statusCode = 200;
                            response.end()
                            console.log("reponse sent to " + request.socket.remoteAddress)

                        }catch(err){

                            response.statusCode = 500;
                            response.end()
                        }
                        
                    }
                }else{
                    response.statusCode =  405
                    console.log("a "+request.method + " request on "+request.url + " not allowed ")
                    response.write("method not allowed")
                    response.end()
                }
            }else{
                response.statusCode =  404
                console.log("repsonse on " + request.url + " failed")
                response.write(_this._default404)
                response.end()
            }
        
          });


    

}}


/*

    END OF MAIN CLASS(NEUTRINO)

*/





let app = new Neutrino(5500);
// app.addroute("/<lilo>", (req:any, res:any, dynamicpar:any) => {
//     console.log(dynamicpar,"dynamic part")
//     res.write("<h1>ALi is  here" + dynamicpar["hsein"] + ' </h1>');
// });
// app.addroute("/ali",  (req:any, res:any )=> {
//     res.write("<h1>ALi is  here" + "alllllllll" + ' </h1>');
// });
// app.addroute("/ali/<lilo>",  (req:any, res:any,dynamic:any )=> {
//     res.write("<h1>ALi is  here" + dynamic["lilo"] + ' </h1>');
// });
// app.addroute("/ali/<lilo>/ali",  (req:any, res:any,dynamic:any )=> {
//     res.write("<h1>ALi is  here" + dynamic["lilo"] + "ali" + ' </h1>');
// });

let router = new Router(app,'/ali',(req:any, res:any, dynamicpar:any) => {

        res.write("<h1>ALi is  here  </h1>");
    })

router.addRoute("/<lilo>/<mimo>/<pat>",(req:any, res:any,dynamic:any )=> {
        res.write("<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>');
    })
app.start()
