const http = require("http");
const fs = require('fs').promises;
const ejs = require('ejs')

/* 

    START OF CONSTANTS 

*/
const IncomingMessageClass = http.IncomingMessage;
const ServerResponseClass  = http.ServerResponse;
type IncomingMessage = typeof IncomingMessageClass;
type ServerResponse  = typeof ServerResponseClass;

//comp

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


let fileTypesToContentType = {}
/*

    END OF CONSTANS

*/

/*

    START OF GLOBAL FUNCTION 

*/
    // READS HTML FILE AND GIVES THE OUT AND CHANGES THE HEAD OF THE RESPONSE
function readhtmlfile(path: string,res: ServerResponse){
        try{
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });

            const data = fs.createReadStream(path,'utf8')
            return data

        }catch (error){
            console.error(error)
        }
        
    }


/*

    END OF GLOBAL FUNCTION 

*/
/*

    START OF LOGGER CLASS

*/
class logger{
    logFile: string;

    constructor(){
        this.logFile = 'logs.txt'
    }

    logMessage(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number) {

        let log = "=========================================================================\n";
        log += "---- " +"logged on " + new Date().toISOString() + '\n';
        log += "---- " +"from the following ip => " + req.ip +'\n';
        log += "---- " +"recived a " + req.method + " request to url => " + req.url +'\n';
        log += "---- " +"request recived with follwoing cookies " + JSON.stringify(req.cookies) + '\n';
        log += "---- " +"response status " + res.statusCode.toString() +'\n';
        log += "---- " +"response took " + parseFloat(timeTaken.toFixed(2)) + " milliseconds to process \n" ;
        return log;


    }

    async log(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number){

        await fs.appendFile(this.logFile, this.logMessage(req, res, timeTaken))

    }
}
/*

    End OF LOGGER CLASS

*/
/*

    START OF ROUTE CLASS

    THE ROUTE CLASS SAVES THE ROUTES AND GIVES US 
    THE ABILITY FOR THR ROUTES TO BE A TREE STRUCUTRE
    SO WE COULD OPTIMIZE THE TIME NEEDED TO SEARCH
    FOR A SPECFIC ROUTE 

*/

class Route{
    parent: any;
    children: Route[];
    func: Function;
    methods: string[];
    route:string;
    fullName:string;
    dynamic:boolean;
    dynamicRoute?: any;

    // dynamicVar:string;

    constructor(route: string, func: Function = (req:any,res:any)=>{res.write(page404)},methods: string[]=["GET"]){


        this.children = [];
        this.func = func;
        this.route = route;
        this.methods = methods;
        this.fullName = route;
        this.dynamic = route[1] === '<' ? true : false || route[0] === '<' ? true : false 
        this.parent =  null
        this.dynamicRoute= null

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
    compareRoutes(route:string):any  {
        let urls = route.split('/');
        let dynamicParts:Record<string,string> = {};
        
        urls = urls.filter(element => element != '' )
        // urls.unshift('')
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
            if ((url != curr.route && curr.route + "/" != url   ) && curr.dynamicRoute != null) {
                curr = curr.dynamicRoute;
                dynamicParts[curr.route.slice(2, curr.route.length - 1)] = url.slice(1);
                lastIsDynamic = true;

            }else if (curr.dynamic){
                dynamicParts[curr.route.slice(1, curr.route.length - 1)] = url.slice(1);
                lastIsDynamic = true;

            }
            else {
                lastIsDynamic = false;
            }
        }
        if ((curr.fullName === route || curr.fullName  + '/'=== route )|| lastIsDynamic|| curr != this) {
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

// REQUEST CLASS ADDS FUNCTIONALITY AND PROPERTIES  TO THE REQUEST OBJECT
class neutrinoResponse extends ServerResponseClass{
    _request:IncomingMessage
    statusAlreadySet:Boolean
    constructor(request: IncomingMessage){
        super(request)
        this._request = request
        this.statusAlreadySet = false;
    }
    writeHtml(htmlRoute:string){
        
        this.write(readhtmlfile(htmlRoute,this._req))
    }
    sendJson(json:{}){
        this.writeHead(200, {
            'Content-Type': 'application/json'
        });
        this.send(JSON.stringify(json))
    }
    render(fileName:string, templateVars:any){
        const html = ejs.renderFile(fileName,templateVars);
        this.send(html);
    }

    serverStaticFile(){
        //todo
        
    }

    setStatusCode(statusCode:number){
        this.statusCode = statusCode;
        this.statusAlreadySet = true
    }
    redirect(url:String) {
        this.setHeader('Location', url);
        this.statusCode = 302;
        this.statusAlreadySet= true

      }
}
// REQUEST CLASS ADDS FUNCTIONALITY AND PROPERTIES  TO THE REQUEST OBJECT
class neutrinoRequest extends IncomingMessageClass{

    _req:IncomingMessage;
    params:any;
    ip:string;
    path:string;
    cookies:any;

    constructor(socket:any){
        super(socket)

        this.params = {};
        this.ip = socket.remoteAddress;
        this.cookies = this.parseCookies();


        let url = this.url.split('?');

        this.path = url[0];

        //THIS LOOP EXTRACTS THE PARAMETER FROM THE URL
        if (url[0] != this.url){
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
  // Check if the cookie header is set
        if (!this.headers.cookie) {
            return {};
        }

        // Split the cookie string into an array of individual cookies
        const cookies = this.headers.cookie.split(';');

        // Create an object to hold the parsed cookies
        const parsedCookies:any = {};

        // Iterate over the array of cookies
        for (const cookie of cookies) {
            // Split the cookie into a key-value pair
            const parts = cookie.split('=');
            const key = parts[0].trim();
            const value = parts[1].trim();

            // Add the key-value pair to the parsedCookies object
            parsedCookies[key] = value;
        }

        return parsedCookies;
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

    constructor(app: Neutrino,mainRoute: string, routeFunc: Function = (req:any,res:any)=>{res.write(page404)},methods: string[]=["GET"]){

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
    findLastCommon(route: string, mainRoute: Route){
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
    continueConstruction(lastRoute: Route,url: string): Route{

        const lastFoundidx = lastRoute.fullName.split('/').length;
        let urls = url.split('/');
        urls = urls.splice(lastFoundidx,urls.length);
        let curr = lastRoute;

        for(const route of urls){
            if(route[0] == "<"){
                let newRoute = new Route("/" + route,);
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
    addRoute(url: string,routeFunc: Function,methods: string[]=["GET"]){
        url = this._mainRoute.fullName + url
        const urls = url.split('/');

        if((urls.length <= 2 && urls[1][0] == '<') ){

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
    _routesobjs: Record<string,Route>;
    _default404:string;
    _mainDynammic:any;
    _middlewares: Function[]
    _logger: logger
    _log: boolean

    constructor(port: number){
        
        this._server = http.createServer({ ServerResponse: neutrinoResponse ,IncomingMessage : neutrinoRequest});
        this._port   = port;
        this._route = new Route('',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")});
        this._mainDynammic = null
        this._logger = new logger()
        this._log = true;
        this._routesobjs = {
                            '/': this._route
                        }
        this._middlewares = []
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
    findLastCommon(route:string,mainRoute: Route): Route{
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
    continueConstruction(lastRoute: Route,url: string): Route{

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

    decideRequestFate(request: neutrinoRequest, response: neutrinoResponse,dynamicVars: Record<string,string>  | null,route: Route){
        if ( route != null){
            if(route.methods.includes(request.method)){
            
                if (route.dynamic){
                    
                    try{
                        for(let i=0; i < this._middlewares.length ; i++){

                            this._middlewares[i](request,response,this._middlewares[i+1],dynamicVars)
                        }

                        route.func(request,response,dynamicVars)
                        if (!response.statusAlreadySet) {
                            response.statusCode = 200;
                        }
                        response.end()
                        console.log("reponse sent to " + request.socket.remoteAddress)

                    }catch(err){

                        response.statusCode = 500;
                        response.end()
                    }

                }else {
                    try{
                        for(let i=0; i < this._middlewares.length ; i++){

                            this._middlewares[i](request,response,this._middlewares[i+1],dynamicVars)

                        }

                        route.func(request,response,dynamicVars)
                        if (!response.statusAlreadySet) {
                            response.statusCode = 200;
                        }
                        response.end()
                        console.log("reponse sent to " + request.socket.remoteAddress)

                    }catch(err){

                        response.statusCode = 500;
                        response.end()
                    }
                    
                }
            }else{
                
                response.statusCode =  405
                console.log("a " + request.method + " request on "+ request.url + " not allowed ")
                response.write("method not allowed")
                response.end()
            }
        }else{

            response.statusCode =  404
            console.log("repsonse on " + request.url + " failed")
            response.write(this._default404)
            response.end()

        }
    }

    // THIS METHODS CHANGES THE DEFAULT 404
    set404(html:string){
        this._default404 = html;
    }
    // THIS IS THE MAIN FUNCTION THAT START THE SERVER

    use(middleware:Function): void{
        this._middlewares.push(middleware)
    }
    disableLogging(){
        this._log = false
    }
    enableLogginf(){
        this._log = true
    }

    start(port: number = this._port) {
        
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at http://127.0.0.1:" + this._port)

        // THE ON METHODS GIVES US THE ABILITY TO EXECUTE A FUNCTION WHEN A REQUEST IS RECIEVED
        this._server.on('request', (request: neutrinoRequest, response: neutrinoResponse) => {

            const requestStart = performance.now();

            let url:string = request.url;
            let possibleParams = url.split('?');

            if(possibleParams[0] != url){
                url = possibleParams[0];
            }

            console.log("Got a " + request.method + " request on " + url);

            const mainRoute = this._route
            let [urlObj,dynamicVars]  = mainRoute.compareRoutes(url)

            if(urlObj == null && typeof this._mainDynammic != 'undefined' ){
                [urlObj,dynamicVars] = this._mainDynammic.compareRoutes(url)
            }

            this.decideRequestFate(request, response, dynamicVars, urlObj)
            const requestEnd = performance.now();

            if(this._log){
                this._logger.log(request,response,requestEnd - requestStart)
            }
        
          });
    }

    staticFilesRoute(){
        
    }
}


/*

    END OF MAIN CLASS(NEUTRINO)

*/



//code examples

// let app = new Neutrino(5500);
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

// let router = new Router(app,'/ali',(req:any, res:any, dynamicpar:any) => {

//         res.write("<h1>ALi is  here  </h1>");
//     })
//"<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>'
// router.addRoute("/ali",(req:any, res:any,dynamic:any ) => {
//         res.write("<h1>lilo is  here  </h1>");
//     },["GET"], ()=>{
//         console.log("|||||||||||||||||||||||||||")
//     })
// app.start()

module.exports.Neutrino = Neutrino
module.exports.readhtmlfile = readhtmlfile
module.exports.Response = neutrinoResponse
module.exports.Request = neutrinoRequest
module.exports.Router = Router
module.exports.Route = Route

