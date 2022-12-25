import { BlobOptions } from "buffer";

const http = require("http");
const fs = require('fs');
const ejs = require('ejs')
const path = require('path');

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


const fileTypesToContentType:Record<string,string> = { 

    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.xls': 'application/vnd.ms-excel',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.zip': 'application/zip',
    '.gzip': 'application/gzip',
    '.tar': 'application/x-tar'
}
/*

    END OF CONSTANS

*/

/*

    START OF GLOBAL FUNCTION 

*/
    // READS HTML FILE AND GIVES THE OUT AND CHANGES THE HEAD OF THE RESPONSE
function readhtmlfile(path: string,res: ServerResponse, logger: logger){
        try{
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });

            const data = fs.readFile(path,'utf8')
            return data

        }catch (error){
            logger.errorsLog += error + '\n'

            console.error(error)
        }
        
    }

function fileExists(filePath:string, logger: logger) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        logger.errorsLog += err + '\n'

        return false;
    }
    }

function readFile(path: string, logger: logger) {
    try {
        // Read the file as a string
        const data = fs.readFileSync(path);
        return data;
    }
    catch (err) {
        console.error(err);
        logger.errorsLog += err + '\n'
    }
    }
function corsMiddleware(req:neutrinoRequest, res:neutrinoResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '3600');

    }

    
let _staticPaths:string[] = []
/*

    END OF GLOBAL FUNCTION 

*/
class ware{
    wares: Function[]
    currentWare: Function
    currentWareIdx:number
    request?:neutrinoRequest
    response?: neutrinoResponse
    Logger: logger

    constructor(logger: logger){
        this.wares = []
        this.currentWare = () => {}
        this.currentWareIdx = -1
        this.Logger = logger
        
    }
    setReqRes(request:neutrinoRequest, response: neutrinoResponse){
        this.request = request
        this.response = response
    }
    startWares(request:neutrinoRequest, response: neutrinoResponse){
        this.setReqRes(request, response)
        this.next() 
    }
    addWare(middleware: Function){
        this.wares.push(middleware)
    }

    next(){
        try {
            this.currentWareIdx += 1 
            if (this.currentWareIdx >= this.wares.length) return this.reset()
            this.wares[this.currentWareIdx](this.request,this.response,this.next.bind(this))
        }catch(err){
            this.Logger.addError(String(err))
        }

    }
    reset(){
        this.currentWareIdx = -1
    }
    removeWare(ware:Function) {
  
        const index = this.wares.indexOf(ware);
        if (index == -1) return console.error("Tried to remove ware that is not added") 
        this.wares.splice(index, 1);

    }
    insertWare(ware:Function,idx: number){
        this.wares.splice(idx,0,ware)
    }
}
/*

    START OF middleWare CLASS

*/

class middleWare extends ware{
    constructor(logger: logger){
        super(logger)
    }
}

/*

    END OF middleWare CLASS

*/
/*

    START OF afterWare CLASS

*/

class afterWare extends ware{
    constructor(logger: logger){
        super(logger)
    }
}


/*

    END OF afterWare CLASS

*/
/*

    START OF rateLimiter CLASS

*/

class rateLimiter{
    rateLimitCache: any
    maxRequests:number
    timePeriod: number
    limitRequestRate: boolean
    constructor(){
        this.rateLimitCache = {}
        this.maxRequests = 100
        this.timePeriod = 60
        this.limitRequestRate = false
    }
    exceededLimit(req:neutrinoRequest, res:neutrinoResponse) {
        // Get the current time
        const now = Date.now();
        // Check if the client's IP address is in the rate limit cache
        if (!this.rateLimitCache[req.ip]) {
          // If not, add the IP address to the cache with the current time and a request count of 1
          this.rateLimitCache[req.ip] = {
            requests: 1,
            startTime: now,
          };
        } else {
          // If the IP address is in the cache, increment the request count
          this.rateLimitCache[req.ip].requests += 1;
        }
        // Calculate the elapsed time since the start of the time period
        const elapsedTime = now - this.rateLimitCache[req.ip].startTime;
        // If the elapsed time is greater than the time period, reset the request count and start time
        if (elapsedTime > this.timePeriod * 1000) {
            this.rateLimitCache[req.ip].requests = 1;
            this.rateLimitCache[req.ip].startTime = now;
        }
        // If the request count is greater than the maximum allowed, return a rate limit exceeded error
        if (this.rateLimitCache[req.ip].requests > this.maxRequests) {
            res.setStatusCode(429)
            res.write('Too many requests. Please try again later.');
            res.end()
            return false
        }
        // If the request count is within the limit, continue to the next middleware or handler
        return true
      }
    
    setLimit(maxRequest:number,timePeriod:number){
        this.maxRequests = maxRequest
        this.timePeriod = timePeriod
    }
}

/*

    END OF rateLimiter CLASS

*/
/*

    START OF LOGGER CLASS

*/
class logger{
    logMessage:string
    logFile: string;
    errorsLog: string;

    constructor(){
        this.logFile = 'logs.txt'
        this.errorsLog = ''
        this.logMessage = ""
    }

    reqResData(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number) {

        return ("=========================================================================\n"
            + "---- " +"logged on " + new Date().toISOString() + '\n'
            + "---- " +"from the following ip => " + req.ip +'\n'
            + "---- " +"recived a " + req.method + " request to url => " + req.url +'\n'
            + "---- " +"request recived with follwoing cookies " + JSON.stringify(req.cookies) + '\n'
            + "---- " +"response status " + res.statusCode.toString() +'\n'
            + "---- " +"response took " + parseFloat(timeTaken.toFixed(2)) + " milliseconds to process \n" 
            + "-------------------------------------------------------------------------\n"
            + '----------------------------- Errors Log --------------------------------\n'
            + this.errorsLog + '\n'
            + "-------------------------------------------------------------------------\n"
            + "---------------------------- Developed Logsqd---------------------------------\n"
            + this.logMessage
            + "-------------------------------------------------------------------------\n")

    }
    addError(err:string){
        this.errorsLog += err
    }
    addToLog(logMessage: string){
        this.logMessage += logMessage + '\n'
    }

    log(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number){

        fs.appendFile(this.logFile, this.reqResData(req, res, timeTaken), (err:any) => {
            if (err) console.error(err);
            
        })

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
    fullRoute:string;
    dynamic:boolean;
    dynamicRoute?: any;

    // dynamicVar:string;

    constructor(route: string, func: Function = (req:any,res:any)=>{res.write(page404)},methods: string[]=["GET"]){


        this.children = [];
        this.func = func;
        this.route = route;
        this.methods = methods;
        this.fullRoute = route;
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
        this.setFullRoute(parent.fullRoute + this.route)
        parent.children.push(this)
    }
    setFullRoute(route:string){
        this.fullRoute = route;
    }
    setDynamicRoute(route:Route){
        route.parent = this
        route.setFullRoute(this.fullRoute + route.route)
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
        if ((curr.fullRoute === route || curr.fullRoute  + '/'=== route )|| lastIsDynamic|| curr != this) {
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

    sendJson(json:{}){
        this.setHeader(
            'Content-Type', 'application/json'
        );
        this.send(JSON.stringify(json))
        return this
    }
    render(fileName:string, templateVars:any){
        const html = ejs.renderFile(fileName,templateVars);
        this.send(html);
        return this

    }

    setStatusCode(statusCode:number){
        this.statusCode = statusCode;
        this.statusAlreadySet = true
        return this

    }
    redirect(url:String) {
        this.setHeader('Location', url);
        this.statusCode = 302;
        this.statusAlreadySet= true
        return this

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
            if(url != curr.route && curr.dynamicRoute != null && url  !=  '/' + urls[urls.length-1] ){
                curr = curr.dynamicRoute
            }

        }
        return curr
        }
    
    // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute: Route,url: string): Route{

        const lastFoundidx = lastRoute.fullRoute.split('/').length;
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
        url = this._mainRoute.fullRoute + url
        const urls = url.split('/');

        if (url == '' || url== '/'){
            
            this._mainRoute.func = routeFunc
            this._mainRoute.methods = methods

        }else if((urls.length <= 2 && urls[1][0] == '<') ){

            this._mainRoute.dynamicRoute = new Route("/"+urls[1],routeFunc,methods)
            this._mainRoute.dynamicRoute.setParent(this._mainRoute)


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
    _middlewares: middleWare
    _afterware: afterWare
    _logger: logger
    _log: boolean
    _rateLimiter: rateLimiter

    constructor(port: number){
        
        this._server = http.createServer({ ServerResponse: neutrinoResponse ,IncomingMessage : neutrinoRequest});
        this._port   = port;

        this._route = new Route('',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")});
        this._mainDynammic = null
        this._routesobjs = {'/': this._route}
        this.staticFilesRoute()

        this._logger = new logger()
        this._log = true;

        this._middlewares = new middleWare(this._logger)
        this._afterware = new afterWare(this._logger)

        this._rateLimiter = new rateLimiter()

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
    // THIS METHODS CHANGES THE DEFAULT 404
    set404(html:string){
        this._default404 = html;
    }

    // 
    use(middleware:Function,): void{
        this._middlewares.addWare(middleware)
    }
    addMiddlWare(middleware:Function,): void{
        this._middlewares.addWare(middleware)
    }
    addAfterWare(afterware: Function){
        this._afterware.addWare(afterware)
    }
    disableLogging(){
        this._log = false
    }
    enableLogginf(){
        this._log = true
    }
    skipMiddleware(){
        this._middlewares.currentWareIdx = this._middlewares.wares.length
    }
    skipAfterware(){
        this._afterware.currentWareIdx = this._middlewares.wares.length
    }
    addRateLimiting(maxRequest: number, timePeriod: number){
        this._rateLimiter.setLimit(maxRequest, timePeriod)
        this._rateLimiter.limitRequestRate = true

    }
    resetLimit(maxRequest: number, timePeriod: number){
        this._rateLimiter.setLimit(maxRequest, timePeriod)
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
            if(url != curr.route && curr.dynamicRoute != null && url  !=  '/' + urls[urls.length-1] ){
                curr = curr.dynamicRoute
            }

        }
        return curr
        }
    
     // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute: Route,url: string): Route{

        const lastFoundidx = lastRoute.fullRoute.split('/').length;

        let urls = url.split('/');
        urls = urls.splice(lastFoundidx,urls.length);

        let curr = lastRoute;
        let newRoute:Route;

        for(const route of urls){
            if(route[0] == "<"){
                newRoute = new Route("/" + route);

                curr.setDynamicRoute(newRoute)
                curr = newRoute

            }else{
                newRoute = new Route("/" + route);

                let fullRoute = newRoute.fullRoute
                // this._routesobjs[fullRoute] = newRoute

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

    get(route: string, routefunc: Function){
        this.addroute(route,routefunc,['GET'])
    }
    post(route: string, routefunc: Function){
        this.addroute(route,routefunc,['post'])
    }
    put(route: string, routefunc: Function){
        this.addroute(route,routefunc,['PUT'])
    }
    delete(route: string, routefunc: Function){
        this.addroute(route,routefunc,['delete'])
    }
    // 
    decideRequestFate(request: neutrinoRequest, response: neutrinoResponse,dynamicVars: Record<string,string>  | null,route: Route){
        if ( route != null){
            if(route.methods.includes(request.method)){
            
                if (route.dynamic){
                    
                    try{
                        route.func(request,response,dynamicVars)
                        if (!response.statusAlreadySet) {
                            response.statusCode = 200;
                        }
                        response.end()
                        console.log("reponse sent to " + request.socket.remoteAddress)

                    }catch(err){

                        this._logger.errorsLog += err + '\n'
                        response.statusCode = 500;
                        response.end()
                    }

                }else {
                    try{
                        route.func(request,response,dynamicVars)
                        if (!response.statusAlreadySet) {
                            response.statusCode = 200;
                        }
                        response.end()
                        console.log("reponse sent to " + request.socket.remoteAddress)

                    }catch(err){
                        this._logger.errorsLog += err + '\n'
                        response.statusCode = 500;
                        response.end()
                    }
                    
                }
            }else{
                //  method not allowed 405 error 
                
                response.statusCode =  405
                console.log("a " + request.method + " request on "+ request.url + " not allowed ")
                response.write("method not allowed")
                response.end()
            }
        }else{
            // page not found error 404 error 
            response.statusCode =  404
            console.log("repsonse on " + request.url + " failed")
            response.write(this._default404)
            response.end()

        }


    }



    // STARTS THE SERVER AND LISTENS FOR REQUEST SENT TO THE SERVER.
    start(port: number = this._port) {
        
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at http://127.0.0.1:" + this._port)

        // THE ON METHODS GIVES US THE ABILITY TO EXECUTE A FUNCTION WHEN A REQUEST IS RECIEVED
        this._server.on('request', (request: neutrinoRequest, response: neutrinoResponse) => {
            /* 
                RECORDED THE START TIME OF THE SERVER RESPONDING TO THe REQUEST
                TO MEASURE IT PERFORMANCE AND LOG IT
            */
            const requestStart = performance.now();

            let url:string = request.url;
            let possibleParams = url.split('?');

            if(possibleParams[0] != url){url = possibleParams[0];}
            console.log("Got a " + request.method + " request on " + url);

            //FIND THE THE RIGHT ROUTE OBJECT FOR THE GIVEN URL
            let routeObj:any;
            let dynamicVars:any;

            [routeObj,dynamicVars]  = this._route.compareRoutes(url)

            if(routeObj == null && typeof this._mainDynammic != 'undefined' ){
                [routeObj,dynamicVars] = this._mainDynammic.compareRoutes(url)
            }

            if(this._rateLimiter.limitRequestRate){
                if(!this._rateLimiter.exceededLimit(request,response)){
                    this._middlewares.startWares(request,response)
                    this.decideRequestFate(request, response, dynamicVars, routeObj)
                    this._afterware.startWares(request,response)
                }
            }
            else{
                this._middlewares.startWares(request,response)
                this.decideRequestFate(request, response, dynamicVars, routeObj)
                this._afterware.startWares(request,response)
            }

            // END TIME CAPTURING 
            const requestEnd = performance.now();
            if(this._log){this._logger.log(request,response,requestEnd - requestStart)}
        
          });
    }

    // ADDS PATH TO STATIC PATH WHICH THE FRAMEWORK SREARCH FOR STATIC FILE FROM.
    addStaticPath(path:string){
        _staticPaths.push(path)
    }

    // CREATES STATIC FILE ROUTE THAT SERVE LOCAL STATICS FILE TO THE BROWSER.
    staticFilesRoute(){
        
        const staticRouteFunc =  (request: neutrinoRequest, response: neutrinoResponse, dynamicvars: any) =>{
            let neededFile:string = ''
            
            for (const dir of _staticPaths) {
                const filePath = path.join(dir, dynamicvars['fileName']);
                if ( fileExists(filePath,this._logger)) {
                    neededFile = filePath;
                }
            }
            response.setStatusCode(200)
            response.setHeader('Content-Type',fileTypesToContentType[path.extname(neededFile)])

            try{

                const data =  readFile(neededFile,this._logger)
                response.write(data)
    
            }catch (error){
                this._logger.errorsLog += error + '\n'
                response.setStatusCode(500)

            }
            
        }
        
        this.addroute('/static/<fileName>',staticRouteFunc)

    }
}

/*

    END OF MAIN CLASS(NEUTRINO)

*/



module.exports.Neutrino = Neutrino
module.exports.readhtmlfile = readhtmlfile
module.exports.Response = neutrinoResponse
module.exports.Request = neutrinoRequest
module.exports.Router = Router
module.exports.Route = Route

