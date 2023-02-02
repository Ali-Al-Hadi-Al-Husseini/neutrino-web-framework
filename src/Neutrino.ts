const http = require("http");
const fs = require('fs');
const ejs = require('ejs')
const path = require('path');
const helmet = require('helmet')
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
let _logger:logger;

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
//     // READS HTML FILE AND GIVES THE OUT AND CHANGES THE HEAD OF THE RESPONSE
// function readhtmlfile(path: string,res: ServerResponse, logger: logger){
//         try{
//             res.writeHead(200, {
//                 'Content-Type': 'text/html'
//             });

//             const data = fs.readFile(path,'utf8')
//             return data

//         }catch (error){
//             logger.errorsLog += error + '\n'

//             console.error(error)
//         }
        
//     }
async function checkInStaticPaths(filename: string){
    let neededFile = '';

    try{
        for (const dir of _staticPaths) {
            const filePath = path.join(dir,filename);
            if (await fileExists(filePath)) {
                neededFile = filePath;
                break
            }
        }
        return neededFile

    } catch(err){
        await _logger.logError(err) 
        return neededFile
    }
}
async function fileExists(filePath:string) {
    try {
        return await fs.statSync(filePath).isFile();
    } catch (err) {
        await  _logger.logError(err)
        // console.error(err)
        return false;
    }
}

async function readFile(path: string) {
    try {
        // Read the file as a string
        const data = await fs.readFileSync(path, 'utf8');
        return data;
    }
    catch (err) {
        await _logger.logError(err)
    }
}


function corsMiddleware(allowedDomains:string[] ): Function {

    const innerMethod = (req:neutrinoRequest, res:neutrinoResponse,next: Function) => {
        res.setHeader('Access-Control-Allow-Origin', allowedDomains)
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '3600');
        res.setHeader('Access-Control-Allow-Methods', `${Object.keys(req.routeObj.methodsFuncs).join(", ")}`);

        next()
    }
    return innerMethod

}

function removeAddons(str:string):string{
    let dynamicPart = str
    let shouldRemove = ['>',"<","/"]

    for(const symbol of shouldRemove){
        dynamicPart = dynamicPart.replace(symbol, '');
    }
    return dynamicPart
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
    setReqRes(request:neutrinoRequest, response: neutrinoResponse):void{
        this.request = request
        this.response = response
    }
    async startWares(request:neutrinoRequest, response: neutrinoResponse): Promise<void>{
        this.setReqRes(request, response)
        await this.next() 
    }
    addWare(middleware: Function): void{
        this.wares.push(middleware)
    }

    async next(): Promise<void>{
        try {
            this.currentWareIdx += 1 
            if (this.currentWareIdx >= this.wares.length) return this.reset()
            await this.wares[this.currentWareIdx](this.request,this.response,this.next.bind(this))
        }catch(err){
            // console.error(err)

            await this.Logger.logError(err)
            this.next()
        }

    }
    reset(): void{
        this.currentWareIdx = -1
    }
    removeWare(ware:Function): void {
  
        const index = this.wares.indexOf(ware);
        if (index == -1) {
            // console.error("Tried to remove ware that is not added") 
        }
        this.wares.splice(index, 1);

    }
    insertWare(ware:Function,idx: number): void{
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
    rateLimitCache: Record<string,any>
    maxRequests:number
    timePeriod: number

    constructor(){
        this.rateLimitCache = {}
        this.maxRequests = 100
        this.timePeriod = 60

    }
    rateLimit(req:neutrinoRequest, res:neutrinoResponse,next :Function): void {
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

        }
        // If the request count is within the limit, continue to the next middleware or handler
        next()
      }
    
    setLimit(maxRequest:number,timePeriod:number): void{
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
    logFile: string;
    enabled: boolean;
    constructor(){
        this.logFile = 'logs.txt'
        this.enabled = false

    }

    reqResData(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number): string {

        return (
            `=========================================================================
            ----   logged on   ${new Date().toISOString()}  \n
            ----   from the following ip =>   ${req.ip} \n
            ----   recived a   req.method   request to url =>   ${req.url} \n
            ----   request recived with follwoing cookies   ${JSON.stringify(req.cookies)}  \n
            ----   response status   ${res.statusCode.toString()} \n
            ----   response took   ${parseFloat(timeTaken.toFixed(2))}   milliseconds to process \n 
            -------------------------------------------------------------------------\n`)

    }
    async logError(err: any){
        if(!this.enabled) return
        let errMsg =(
        `----------------------------- Errors Log --------------------------------
        ----${String(err)}  \n
        -------------------------------------------------------------------------\n`)
        
        await fs.appendFile(this.logFile, errMsg, (err:Error) => {
        if (err) console.error(err);
        
    })

    }
    async log(logMessage: string){
        if(!this.enabled) return
        let develoerMessage = (
            `---------------------------- Developer Logs---------------------------------
            ----${logMessage}  \n
            ----------------------------------------------------------------------------\n`)

            await fs.appendFile(this.logFile, develoerMessage, (err:Error) => {
                if (err) console.error(err);
                
            })   
                            
    }

    async mainlog(req: neutrinoRequest,res: neutrinoResponse, timeTaken: Number){
        if(!this.enabled) return
        await fs.appendFile(this.logFile, this.reqResData(req, res, timeTaken), (err:Error) => {
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
    // methods: string[];
    route:string;
    fullRoute:string;
    isDynamic:boolean;
    dynamicRoute?: any;
    methodsFuncs: Record<string,Function>;
    // dynamicVar:string;

    constructor(route: string, func: Function = (req:neutrinoRequest,res:neutrinoResponse)=>{res.write(page404)},methods: string[]=["GET"]){

        this.children = [];
        this.route = route;
        // this.methods = methods;
        this.fullRoute = route;
        this.isDynamic = route[1] === '<' ? true : false || route[0] === '<' ? true : false 
        this.parent =  null
        this.dynamicRoute= null
        this.methodsFuncs = this.populateMethodsFuncs(func,methods)

    }
    // ADDS A CHILD TO THE CURRENT ROUTE INTANCE 
    populateMethodsFuncs(func: Function,methods: string[]): Record<string,Function>{
        let methodsFuncs:Record<string,Function> = {}
        for(const method of methods){
            methodsFuncs[method] = func
        }
        return methodsFuncs
    }
    addMethod(method:string,Function:Function): void{
        this.methodsFuncs[method] = Function
        
    }
    addChild(child:Route): void{
        if(child.route[1] === '<'){
            this.setDynamicRoute(child);

        }else{
            child.setParent(this)

           } 
    }
    // SETS THE  PARENT TO THE CURRENT ROUTE INTANCE 
    setParent(parent: Route): void{
        this.parent = parent;
        this.setFullRoute(parent.fullRoute + this.route)
        parent.children.push(this)
    }
    setFullRoute(route:string): void{
        this.fullRoute = route;
    }
    setDynamicRoute(route:Route): void{
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
    async compareRoutes(route:string,request: neutrinoRequest):Promise<any>  {
        // there are some uncessary ops that could be removed
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
                dynamicParts[removeAddons(curr.route)] = removeAddons(url);
                lastIsDynamic = true;

            }else if (curr.isDynamic){

                dynamicParts[removeAddons(curr.route)] = removeAddons(url);
                lastIsDynamic = true;

            }
            else {
                lastIsDynamic = false;
            }
        }

        let isAValidRoute = (curr.fullRoute === route || curr.fullRoute  + '/'=== route ) || lastIsDynamic || curr != this

        if (isAValidRoute) {
            request.dynamicParts = dynamicParts
            return curr
        }
        return null;
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

    async sendJson(json:{}){
        this.setHeader(
            'Content-Type', 'application/json'
        );
        await this.write(JSON.stringify(json))
        return this
    }
    // to change the templating framework just replac ejs with framework you want
    async render(fileName:string, templateVars:Record<string,string>={}, ){

        let html:string = ''
        let filePath = await checkInStaticPaths(fileName)
        let error 

        await ejs.renderFile(filePath,templateVars,(err:Error, string:string)=>{
            if (err){ 
                error = err
                throw new Error("ejs.render file producing and error")  }
            html = string
        });

        if (error){

            await _logger.logError(error)
            this.send404()
            return this
        }

        this.setHeader(
            'Content-Type', 'text/html'
        );
        await this.sendHtml(html);
        return this

    }

    setStatusCode(statusCode:number): neutrinoResponse{
        this.statusCode = statusCode;
        this.statusAlreadySet = true
        return this

    }
    redirect(url:String): neutrinoResponse {
        this.setHeader('Location', url);
        this.statusCode = 302;
        this.statusAlreadySet= true
        return this

    }
    async sendHtml(html:string){
        this.setHeader(
            'Content-Type', 'text/html'
        );
        await this.write(html);        
        await this.end()
    }
    async send(txt:string){
        await this.write(txt)
    }
    send404(){
        this.setStatusCode(404)
    }
}
// REQUEST CLASS ADDS FUNCTIONALITY AND PROPERTIES  TO THE REQUEST OBJECT
class neutrinoRequest extends IncomingMessageClass{

    _req:IncomingMessage;
    params:Record<string,string>;
    ip:string;
    path:string;
    cookies:Record<string,string>;
    dynamicParts:Record<string,string>
    routeObj:Route | any

    constructor(socket:any){
        super(socket)

        this.params = {};
        this.ip = socket.remoteAddress;
        this.cookies = this.parseCookies();
        this.dynamicParts = {}

        let url = this.url.split('?');

        this.path = url[0];

        //THIS LOOP EXTRACTS THE PARAMETER FROM THE URL
        if (url[0] != this.url){
            this.params = this.parseParams(url[1])
        }

    }
    /* 
        THIS METHODS PARSERS THRE COOKIES AND 
        RETURN A DICTIONART WITH THE KEYS
        AS COOKIES NAMES AND VALUES AS COOKIES VALUES
    */
    parseCookies ():Record<string,string> {
  // Check if the cookie header is set
        if (!this.headers.cookie) {
            return {};
        }

        // Split the cookie string into an array of individual cookies
        const cookies = this.headers.cookie.split(';');

        // Create an object to hold the parsed cookies
        const parsedCookies:Record<string,string> = {};

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
    parseParams(url:string): Record<string,string>{
        let unParesedParams:string[] = url.split('&');
        let parresdParams:Record<string,string> = {}

        for (let param of unParesedParams) {
            let [varName, value] = param.split('=');
            parresdParams[varName] = value;
        }
        return parresdParams
    }
    
    //GET INFO FROM HEADERS
    get(input:string): string{
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

    constructor(app: Neutrino,mainRoute: string, routeFunc: Function = (req:neutrinoRequest,res:neutrinoResponse)=>{res.write(page404)},methods: string[]=["GET"]){

        this._app = app;
        let lastFound = this._app._findLastCommon(mainRoute,this._app._route)
        this._mainRoute = this._app._continueConstruction(lastFound,mainRoute)
        

        this._mainRoute.methodsFuncs = this._mainRoute.populateMethodsFuncs(routeFunc,methods)
        
    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)   

    */
    _findLastCommon(route: string, mainRoute: Route): Route {
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
    _continueConstruction(lastRoute: Route,url: string): Route{

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
    addRoute(url: string,routeFunc: Function,methods: string[]=["GET"]): void{
        url = this._mainRoute.fullRoute + url
        const urls = url.split('/');

        if (url == '' || url== '/'){

            this._mainRoute.methodsFuncs = this._mainRoute.populateMethodsFuncs(routeFunc,methods)

        }else if((urls.length <= 2 && urls[1][0] == '<') ){

            this._mainRoute.dynamicRoute = new Route("/" + urls[1], routeFunc, methods)
            this._mainRoute.dynamicRoute.setParent(this._mainRoute)


        }else{
            let mainRoute = this._mainRoute;
        
            if (mainRoute != null){
                let lastCommonRoute = this._findLastCommon(url,mainRoute);
                let finalRoute = this._continueConstruction(lastCommonRoute,url);


                finalRoute.methodsFuncs = finalRoute.populateMethodsFuncs(routeFunc,methods)

            
            }else{

                let lastCommonRoute = this._findLastCommon(url,this._mainRoute.dynamicRoute);
                let finalRoute = this._continueConstruction(lastCommonRoute,url);

                finalRoute.methodsFuncs = finalRoute.populateMethodsFuncs(routeFunc,methods)

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

    _404Route: Route
    _default404:string;
    // _mainDynammic:Route | null;
    _middlewares: middleWare
    _afterware: afterWare
    _logger: logger
    _rateLimiter: rateLimiter
    _allowedDoamins?: string[]


    constructor(port: number = 5500){
        
        this._server = http.createServer({ ServerResponse: neutrinoResponse ,IncomingMessage : neutrinoRequest});
        this._port   = port;

        this._404Route = new Route('',(req:neutrinoResponse,res:neutrinoRequest)=>{res.setStatusCode(404) ; res.sendHtml(this.get404()).bind(this)})
        this._route = new Route('',(req:neutrinoResponse,res:neutrinoRequest)=>{res.sendHtml("<h1>Neutrino</h1>")});

        // this._mainDynammic = null
        this._routesobjs = {'/': this._route}

        this._logger = new logger()

        this._middlewares = new middleWare(this._logger)
        this._afterware = new afterWare(this._logger)

        this._rateLimiter = new rateLimiter()
        this._default404 = this.get404()
        this.staticFilesRoute()
    }
    get(route: string, routefunc: Function): void{
        this.addRoute(route,routefunc,['GET'])
    }
    post(route: string, routefunc: Function): void{
        this.addRoute(route,routefunc,['POST'])
    }
    put(route: string, routefunc: Function): void{
        this.addRoute(route,routefunc,['PUT'])
    }
    delete(route: string, routefunc: Function): void{
        this.addRoute(route,routefunc,['DELETE'])
    }
    // THIS METHODS CHANGES THE DEFAULT 404
    set404(html:string): void{
        this._default404 = html;
    }
    get404(): string{
        return `    <div style=" display: flex;
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

    // adding middlware 
    use(middleware:Function,): void{
        this._middlewares.addWare(middleware)
    }
    addMiddlWare(middleware:Function,): void{
        this._middlewares.addWare(middleware)
    }
    addAfterWare(afterware: Function): void{
        this._afterware.addWare(afterware)
    }
    log(msg:string){
        this._logger.log(msg)
    }
    disableLogging(): void{
        this._logger.enabled = false
    }
    enableLogging(): void{

        if (!this._routesobjs.hasOwnProperty('/ct-report')){
            this.post('/ct-report', (req:neutrinoRequest, res:neutrinoResponse) => {
                this._logger.logError(req.body)
                res.write('CT failure report received and processed');
            });
    }
        _logger = this._logger
        this._logger.enabled = true
    }
    skipMiddlewares(): void{
        this._middlewares.currentWareIdx = this._middlewares.wares.length
    }
    skipAfterwares(): void{
        this._afterware.currentWareIdx = this._afterware.wares.length
    }
    insertMiddleware(middlware:Function, idx:number): void{
        this._middlewares.insertWare(middlware,idx)
    }
    insertAfterware(afterware:Function, idx:number): void{
        this._afterware.insertWare(afterware,idx)
    }
    addRateLimiting(maxRequest: number, timePeriod: number): void{
        this._rateLimiter.setLimit(maxRequest, timePeriod)
        this._middlewares.insertWare(this._rateLimiter.rateLimit.bind(this._rateLimiter),0)

    }
    resetRateLimit(maxRequest: number, timePeriod: number): void{
        this._rateLimiter.setLimit(maxRequest, timePeriod)
    }
    addStrictSecruityMeasures(allowedDomains: string[]): void{
        // this method doesn't fit all apps need u may have to change some optionss
        // to obtain the most security 
        /*
            helmet(): This middleware sets various HTTP headers to help protect your app from some well-known web vulnerabilities by setting the following HTTP headers:
            X-Content-Type-Options: nosniff: Prevents browser from trying to guess the MIME type of a file and using it in the event that the server doesn't specify one.
            X-DNS-Prefetch-Control: off: Prevents DNS prefetching by the browser, which can leak information about your app's structure and third-party requests.
            X-Frame-Options: SAMEORIGIN: Prevents your app from being embedded in a frame or iframe on another site, which could allow clickjacking attacks.
            X-XSS-Protection: 1; mode=block: Enables the browser's built-in XSS protection.
        */

            this.use(helmet.crossOriginOpenerPolicy({
                sameOrigin: true,
                allowUnsafeNone: false
            }));
            this.use(helmet.crossOriginResourcePolicy({
                policy: 'same-origin'
              }));
            this.use(helmet.dnsPrefetchControl({
                allow: false
              }));
            this.use(helmet.expectCt(
                {
                    maxAge: 30,
                    enforce: true,
                    reportUri: '/ct-report'
                }));

            this.use(helmet.hidePoweredBy());
            this.use(helmet.hsts({
                maxAge: 15552000, // 180 days in seconds
                includeSubDomains: true,
                preload: true,
              }));
            this.use(helmet.ieNoOpen());
            this.use(helmet.noSniff());
            this.use(helmet.originAgentCluster());
            this.use(helmet.permittedCrossDomainPolicies({
                value: 'master-only'
              }));
            this.use(helmet.referrerPolicy({
                policy: 'same-origin'
            }));

            this.setAllowedDomains(allowedDomains);

            this.use(helmet.xssFilter());
            this.use((req: neutrinoRequest, res: neutrinoResponse, next:Function) =>{
                res.setHeader('X-XSS-Protection','1; mode=block')
                next()
            })
        }
    
    setAllowedDomains(allowedDomains: string[]): void{
        allowedDomains = ["'self'", ...allowedDomains]
        this._allowedDoamins = allowedDomains
        
        this.use(helmet.frameguard({
            action: 'sameorigin',
            frameAncestors: allowedDomains
          }))
        this.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: this._allowedDoamins != undefined ? this._allowedDoamins:["'self'"],
            styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com',...allowedDomains]
        }
        }));
        this.use(helmet.crossOriginEmbedderPolicy({
            requireCorp: true,
            allowedOrigins: allowedDomains
          }))
       this.use(corsMiddleware(allowedDomains))
    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)   

    */
    _findLastCommon(route:string,mainRoute: Route): Route{
        let urls  = route.split("/");
        let curr = mainRoute;  
        urls.shift()

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
    _continueConstruction(lastRoute: Route,url: string): Route{

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
                continue
            }

            newRoute = new Route("/" + route);

            let fullRoute = newRoute.fullRoute
            // this._routesobjs[fullRoute] = newRoute

            curr.addChild(newRoute);
            curr = newRoute;
            
        }   
        
        return curr
    }
    // ADDS ROUTES OBJECT TO THE TREE
    addRoute(url: string, routeFunc:Function,methods: string[]= ["GET"]): void{

        const urls = url.split('/');
        let mainRoute = this._route;
        let newRoute:Route = this._404Route

        newRoute.fullRoute  = url
        newRoute.route = url

        if(url in this._routesobjs){
            newRoute = this._routesobjs[url]
            for(const method of methods){
                newRoute.methodsFuncs[method] = routeFunc
            }
        }
        // else if(urls.length <= 2 && urls[1][0] == '<'){

        //     this._route.setDynamicRoute(new Route(urls[1],routeFunc,methods))

        // }
        
        else if(urls.length <= 2){
            let newMainRoute = new Route(url,routeFunc,methods);
            newRoute =  newMainRoute
            this._route.addChild(newMainRoute);

        }else if(mainRoute != null) {
            
            let lastCommonRoute = this._findLastCommon(url,mainRoute);
            let finalRoute = this._continueConstruction(lastCommonRoute,url);

            finalRoute.methodsFuncs = finalRoute.populateMethodsFuncs(routeFunc,methods)
            newRoute =  finalRoute


        }
        // else if (this._route.dynamicRoute != null){
            
        //     let lastCommonRoute = this._findLastCommon(url,this._route.dynamicRoute);
        //     let finalRoute = this._continueConstruction(lastCommonRoute,url);

        //     finalRoute.methodsFuncs = finalRoute.populateMethodsFuncs(routeFunc,methods)

        //     this._route.dynamicRoute.addChild(finalRoute)
        //     newRoute =  finalRoute

        // }
        this._routesobjs[url] = newRoute
    }

    // adding routes for a specfic method

    // 
    async decideRequestFate(request: neutrinoRequest, response: neutrinoResponse,route: Route){
        try{
            request.routeObj = route

        if ( route == null) {
            // page not found error 404 error 
            this._404Route.methodsFuncs['GET'](request,response)
            
        } else if(!route.methodsFuncs.hasOwnProperty(request.method)){
            //  method not allowed 405 error 
            response.statusCode =  405
            // console.log("a " + request.method + " request on "+ request.url + " not allowed ")
            await response.write("method not allowed")
            await response.end()
             
        }else if (route.isDynamic){
            try{
                await route.methodsFuncs[request.method](request,response)
                if (!response.statusAlreadySet) {
                    response.statusCode = 200;
                }
                await response.end()
                // console.log("response sent to " + request.socket.remoteAddress)

            }catch(err){
                // console.error(err)
                
                await this._logger.logError(err)
                response.statusCode = 500;
                await response.end()
            }

        }else {
            try{
                await route.methodsFuncs[request.method](request,response)
                if (!response.statusAlreadySet) {
                    response.statusCode = 200;
                }
                await response.end()
                // console.log("response sent to " + request.socket.remoteAddress)
                

            }catch(err){
                // console.error(err)
                await this._logger.logError(err)

                response.statusCode = 500;
                await response.end()
                
            }
             
        }} 
        catch(err){
            await this._logger.logError(err)

            // console.error(err)
        }
    }

    
    async handleRequest(request: neutrinoRequest, response: neutrinoResponse){
        try{
        /* 
            RECORDED THE START TIME OF THE SERVER RESPONDING TO THe REQUEST
            TO MEASURE IT PERFORMANCE AND LOG IT
        */
        const requestStart = performance.now();

        let url:string = request.url;
        let possibleParams = url.split('?');

        if(possibleParams[0] != url){url = possibleParams[0];}
        // console.log("Got a " + request.method + " request on " + url);

        //FIND THE THE RIGHT ROUTE OBJECT FOR THE GIVEN URL
        let routeObj:Route;

        /* 
                *checks if url in routeobjs object 
                *only return true if the route is not dynmaic
                *If it is not found in the route objects,
                tree traversal is used to locate a matching
                dynamic route in the main route object.
                

        */
        if(url in this._routesobjs){
            routeObj = this._routesobjs[url]

        }else{
            routeObj  = await this._route.compareRoutes(url,request)
        }
        // if(routeObj == null &&  this._mainDynammic != null ){
        //     routeObj = await this._mainDynammic.compareRoutes(url,request)
        // }

        /*
            this part handles three parts middlware, given fucnction 
        g
        */
        await this._middlewares.startWares(request,response)
        if (!response.writableEnded){
            await this.decideRequestFate(request, response, routeObj)
        }
        await this._afterware.startWares(request,response)

        // END TIME CAPTURING 
        await this._logger.mainlog(request,response,performance.now() - requestStart)

        }catch(err){
            // console.error(err)
            await this._logger.logError(err)

            if(!response.writableEnded){
                response.setStatusCode(500)
                await request.end()
            }
        }
        
    }
    

    // STARTS THE SERVER AND LISTENS FOR REQUEST SENT TO THE SERVER.
    async start(port: number = this._port) {
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at http://127.0.0.1:" + this._port)

        // THE ON METHODS GIVES US THE ABILITY TO EXECUTE A FUNCTION WHEN A REQUEST IS RECIEVED
        await this._server.on('request',this.handleRequest.bind(this));
    }


    // ADDS PATH TO STATIC PATH WHICH THE FRAMEWORK SREARCH FOR STATIC FILE FROM.
    addStaticPath(path:string): void{
        _staticPaths.push(path)
    }

    // CREATES STATIC FILE ROUTE THAT SERVE LOCAL STATICS FILE TO THE BROWSER.
    staticFilesRoute(){
        const staticRouteFunc =  async (request: neutrinoRequest, response: neutrinoResponse) =>{
            let neededFilePath:string = await checkInStaticPaths(request.dynamicParts['filename'])
 
            if (neededFilePath == ""){
                response.setStatusCode(404)
                await response.end()
            }
            try{
                response.setStatusCode(200)
                response.setHeader('Content-Type',fileTypesToContentType[path.extname(neededFilePath)])
                const data = await   readFile(neededFilePath)
                await response.write(data)
    
            }catch (error){

                await this._logger.logError(error)
                response.setStatusCode(500)
            }
            
        }
        
        this.addRoute('/static/<fileName>',staticRouteFunc)

    }
}

/*

    END OF MAIN CLASS(NEUTRINO)

*/



module.exports.Neutrino = Neutrino
// module.exports.readhtmlfile = readhtmlfile
module.exports.Response = neutrinoResponse
module.exports.Request = neutrinoRequest
module.exports.Router = Router
module.exports.Route = Route
module.exports.corsMiddleware = corsMiddleware
module.exports.logger = logger
module.exports.Ware = ware
module.exports.rateLimiter = rateLimiter
module.exports.neutrinoRequest = neutrinoRequest
module.exports.neutrinoResponse = neutrinoResponse
