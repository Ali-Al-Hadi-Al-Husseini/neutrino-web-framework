"use strict";
const http = require("http");
const fs = require('fs');
/*

    START OF CONSTANTS

*/
const IncomingMessage = http.IncomingMessage;
const ServerResponse = http.ServerResponse;
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
                        </div>`;
/*

    END OF CONSTANS

*/
/*

    START OF GLOVAL FUNCTION

*/
// READS HTML FILE AND GIVES THE OUT AND CHANGES THE HEAD OF THE RESPONSE
function readhtmlfile(path, res) {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        const data = fs.createReadStream(path, 'utf8');
        return data;
    }
    catch (error) {
        console.error(error);
    }
}
function setMainDefault404(default404) {
    page404 = default404;
}
/*

    END OF GLOVAL FUNCTION

*/
/*

    START OF ROUTE CLASS

    THE ROUTE CLASS SAVES THE ROUTES AND GIVES US
    THE ABILITY FOR THR ROUTES TO BE A TREE STRUCUTRE
    SO WE COULD OPTIMIZE THE TIME NEEDED TO SEARCH
    FOR A SPECFIC ROUTE

*/
class Route {
    // dynamicVar:string;
    constructor(route, func = (req, res) => { res.write(page404); }, methods = ["GET"], ...args) {
        this.parent = null;
        this.children = [];
        this.func = func;
        this.middlware = args;
        this.route = route;
        this.methods = methods;
        this.fullName = route;
        this.dynamic = route[1] === '<' ? true : false;
        this.dynamicRoute = null;
    }
    // ADDS A CHILD TO THE CURRENT ROUTE INTANCE 
    addChild(child) {
        if (child.route[1] === '<') {
            this.dynamicRoute = child;
        }
        else {
            child.setParent(this);
        }
    }
    // SETS THE  PARENT TO THE CURRENT ROUTE INTANCE 
    setParent(parent) {
        this.parent = parent;
        this.setFullRoute(parent.fullName + this.route);
        parent.children.push(this);
    }
    setFullRoute(route) {
        this.fullName = route;
    }
    setDynamicRoute(route) {
        route.parent = this;
        route.setFullRoute(this.fullName + route.route);
        this.dynamicRoute = route;
    }
    /*
        THIS METHODS TAKES A ROUTE(URL) AND THEN
        PARSES THREW IT TO GET THE DYNAMIC PARTS IN IT
        AND TO CHECK IF THE INPUT  IS  THE SAME AS
        THIS ISTANCE ROUTE
     */
    compareRoutes(route) {
        let urls = route.split('/');
        let dynamicParts = {};
        urls = urls.filter(element => element != '');
        let curr = this;
        let lastIsDynamic = false;
        for (let url of urls) {
            url = '/' + url;
            for (const child of curr.children) {
                if (child.route === url || child.route + "/" === url) {
                    curr = child;
                    break;
                }
            }
            if ((url != curr.route && curr.route + "/" != url) && curr.dynamicRoute != null) {
                curr = curr.dynamicRoute;
                dynamicParts[curr.route.slice(2, curr.route.length - 1)] = url.slice(1);
                lastIsDynamic = true;
            }
            else {
                lastIsDynamic = false;
            }
        }
        if ((curr.fullName === route || curr.fullName + '/' === route) || lastIsDynamic) {
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
class _Response extends http.ServerResponse {
    constructor(response, request) {
        super(request);
        this._res = response;
    }
    writeHtml(htmlRoute) {
        this._res.write(readhtmlfile(htmlRoute, this._req));
    }
    sendJson(json) {
        this._res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        this._req.send(JSON.stringify(json));
    }
}
// REQUEST CLASS ADDS FUNCTIONALITY AND PROPERTIES  TO THE REQUEST OBJECT
class _Request extends http.IncomingMessage {
    constructor(request, app) {
        super(request.socket);
        this.app = app;
        this._req = request;
        this.params = {};
        this.ip = this._req.socket.remoteAddress;
        this.cookies = this.parseCookies;
        let url = this._req.url.split('?');
        this.path = url[0];
        //THIS LOOP EXTRACTS THE PARAMETER FROM THE URL
        if (url[0] != this._req.url) {
            let params = url[1].split('&');
            for (let param of params) {
                let [varName, value] = param.split('=');
                this.params[varName] = value;
            }
        }
    }
    /*
        THIS METHODS PARSERS THRE COOKIES AND
        RETURN A DICTIONART WITH THE KEYS
        AS COOKIES NAMES AND VALUES AS COOKIES VALUES
    */
    parseCookies() {
        let list = {}, rc = this._req.headers.cookie;
        rc && rc.split(';').forEach(function (cookie) {
            let parts = cookie.split('=');
            let newParts = [];
            if (parts.length < 2) {
                for (let i = 0; i < (parts.length - 1); i++) {
                    newParts[0] += parts[i];
                }
                newParts[1] = parts[parts.length - 1];
            }
            else {
                newParts = parts;
            }
            list[newParts[0]] = decodeURI(parts[1]);
        });
        return list;
    }
    //GET INFO FROM HEADERS
    get(input) {
        return this.headers[input];
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
class Router {
    constructor(app, mainRoute, routeFunc = (req, res) => { res.write(page404); }, methods = ["GET"], ...args) {
        this._app = app;
        let lastFound = this._app.findLastCommon(mainRoute, this._app._route);
        this._mainRoute = this._app.continueConstruction(lastFound, mainRoute);
        this._mainRoute.func = routeFunc;
        this._mainRoute.methods = methods;
        this._mainRoute.middlware = args;
    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)

    */
    findLastCommon(route, mainRoute) {
        let urls = route.split("/");
        let curr = mainRoute;
        for (let url of urls) {
            url = '/' + url;
            for (const child of curr.children) {
                if (child.route === url) {
                    curr = child;
                    break;
                }
            }
            if (url != curr.route && curr.dynamicRoute != null) {
                curr = curr.dynamicRoute;
            }
        }
        return curr;
    }
    // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute, url) {
        const lastFoundidx = lastRoute.fullName.split('/').length;
        let urls = url.split('/');
        urls = urls.splice(lastFoundidx, urls.length);
        let curr = lastRoute;
        for (const route of urls) {
            if (route[0] == "<") {
                let newRoute = new Route("/" + route);
                curr.setDynamicRoute(newRoute);
                curr = newRoute;
            }
            else {
                let newRoute = new Route("/" + route);
                curr.addChild(newRoute);
                curr = newRoute;
            }
        }
        return curr;
    }
    // ADD ROUTES TO THE MAIN ROUTER
    addRoute(url, routeFunc, methods = ["GET"], ...args) {
        url = this._mainRoute.fullName + url;
        const urls = url.split('/');
        if (urls.length <= 2 && urls[1][0] == '<') {
            this._mainRoute.dynamicRoute = new Route("/" + urls[1], routeFunc, methods, ...args);
            this._mainRoute.dynamicRoute.setParent(this._mainRoute);
            // }else if(urls.length <= 2){
            //     let newMainRoute = new Route(url,routeFunc,methods); 
            //     this._mainRoute.addChild(newMainRoute);
        }
        else {
            let mainRoute = this._mainRoute;
            if (mainRoute != null) {
                let lastCommonRoute = this.findLastCommon(url, mainRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute, url);
                finalRoute.func = routeFunc;
                finalRoute.methods = methods;
                finalRoute.middlware = args;
            }
            else {
                let lastCommonRoute = this.findLastCommon(url, this._mainRoute.dynamicRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute, url);
                finalRoute.func = routeFunc;
                finalRoute.methods = methods;
                finalRoute.middlware = args;
                this._mainRoute.dynamicRoute.addChild(finalRoute);
            }
        }
    }
}
/*

    START OF MAIN CLASS(NEUTRINO)

*/
class Neutrino {
    constructor(port) {
        this._server = http.createServer();
        this._port = port;
        this._route = new Route('', (req, res) => { res.write("<h1>Neutrino</h1>"); });
        this._mainDynammic = null;
        this._routesobjs = {
            '/': new Route('/', (req, res) => { res.write("<h1>Neutrino</h1>"); })
        };
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
                            </div>`;
    }
    /*
        
        FIND  THE LAST COMMON ROUTE OBJECT THAT MATCHS THE
        INPUT URL(ROUTE)

    */
    findLastCommon(route, mainRoute) {
        let urls = route.split("/");
        let curr = mainRoute;
        for (let url of urls) {
            url = '/' + url;
            for (const child of curr.children) {
                if (child.route === url) {
                    curr == child;
                    break;
                }
            }
            if (url != curr.route && curr.dynamicRoute != null) {
                curr = curr.dynamicRoute;
            }
        }
        return curr;
    }
    // ADD ROUTES TO THE TREE SO IT CANNED BE PARSED TO GET THR URL 
    continueConstruction(lastRoute, url) {
        const lastFoundidx = lastRoute.fullName.split('/').length;
        let urls = url.split('/');
        urls = urls.splice(lastFoundidx, urls.length);
        let curr = lastRoute;
        for (const route of urls) {
            if (route[0] == "<") {
                let newRoute = new Route("/" + route);
                curr.setDynamicRoute(newRoute);
                curr = newRoute;
            }
            else {
                let newRoute = new Route("/" + route);
                curr.addChild(newRoute);
                curr = newRoute;
            }
        }
        return curr;
    }
    // ADDS ROUTES OBJECT TO THE TREE
    addroute(url, routeFunc, methods = ["GET"], ...args) {
        const urls = url.split('/');
        if (urls.length <= 2 && urls[1][0] == '<') {
            this._mainDynammic = new Route(urls[1], routeFunc, methods, ...args);
        }
        else if (urls.length <= 2) {
            let newMainRoute = new Route(url, routeFunc, methods, ...args);
            this._route.addChild(newMainRoute);
        }
        else {
            let mainRoute = this._route;
            if (mainRoute != null) {
                let lastCommonRoute = this.findLastCommon(url, mainRoute);
                let finalRoute = this.continueConstruction(lastCommonRoute, url);
                finalRoute.func = routeFunc;
                finalRoute.methods = methods;
                finalRoute.middlware = args;
            }
            else {
                let lastCommonRoute = this.findLastCommon(url, this._mainDynammic);
                let finalRoute = this.continueConstruction(lastCommonRoute, url);
                finalRoute.func = routeFunc;
                finalRoute.methods = methods;
                finalRoute.middlware = args;
                this._mainDynammic.addChild(finalRoute);
            }
        }
    }
    // THIS METHODS CHANGES THE DEFAULT 404
    set404(html) {
        this._default404 = html;
    }
    // THIS IS THE MAIN FUNCTION THAT START THE SERVER
    start(port = this._port) {
        let _this = this;
        this._port = port;
        this._server.listen(this._port);
        console.log("Neutrino Server live at http://127.0.0.1:" + this._port);
        // THE ON METHODS GIVES US THE ABILITY TO EXECUTE A FUNCTION WHEN A REQUEST IS RECIEVED
        this._server.on('request', (request, response) => {
            let url = request.url;
            let possibleParams = url.split('?');
            const _request = new _Request(request, this);
            const _response = response;
            if (possibleParams[0] != url) {
                url = possibleParams[0];
            }
            const method = request.method;
            console.log("Got a " + method + " request on " + url);
            const mainRoute = this._route;
            const found = mainRoute.compareRoutes(url);
            const urlObj = found[0];
            const dynamicVars = found[1];
            if (urlObj != null) {
                if (urlObj.methods.includes(method)) {
                    if (urlObj.dynamic) {
                        try {
                            for (let i = 0; i < urlObj.middlware.length; i++) {
                                if (i === urlObj.middlware.length - 1) {
                                    urlObj.middlware[i](_request, _response, dynamicVars, urlObj.func);
                                }
                                else {
                                    urlObj.middlware[i](_request, _response, dynamicVars, urlObj.middlware[i + 1]);
                                }
                            }
                            urlObj.func(_request, _response, dynamicVars);
                            _response.statusCode = 200;
                            _response.end();
                            console.log("reponse sent to " + request.socket.remoteAddress);
                        }
                        catch (err) {
                            _response.statusCode = 500;
                            _response.end();
                        }
                    }
                    else {
                        try {
                            for (let i = 0; i < urlObj.middlware.length; i++) {
                                urlObj.middlware[i](_request, _response, dynamicVars, urlObj.middlware[i + 1]);
                            }
                            urlObj.func(_request, _response);
                            _response.statusCode = 200;
                            _response.end();
                            console.log("reponse sent to " + request.socket.remoteAddress);
                        }
                        catch (err) {
                            _response.statusCode = 500;
                            _response.end();
                        }
                    }
                }
                else {
                    _response.statusCode = 405;
                    console.log("a " + request.method + " request on " + request.url + " not allowed ");
                    _response.write("method not allowed");
                    _response.end();
                }
            }
            else {
                _response.statusCode = 404;
                console.log("repsonse on " + request.url + " failed");
                _response.write(_this._default404);
                _response.end();
            }
        });
    }
}
/*

    END OF MAIN CLASS(NEUTRINO)

*/

// code examples
// let app = new Neutrino(5500);
// app.addroute("/<lilo>", (re, res, dynamicpar) => {
//     console.log(dynamicpar,"dynamic part")
//     res.write("<h1>ALi is  here" + dynamicpar["hsein"] + ' </h1>');
// });
// app.addroute("/ali",  (req:any, res:any )=> {
//     res.write("<h1>ALi is  here" + "alllllllll" + ' </h1>');
// });
// app.addroute("/ali/<lilo>",  (req, res,dynamic )=> {
//     res.write("<h1>ALi is  here" + dynamic["lilo"] + ' </h1>');
// });
// app.addroute("/ali/<lilo>/ali",  (req, res,dynamic )=> {
//     res.write("<h1>ALi is  here" + dynamic["lilo"] + "ali" + ' </h1>');
// });
// let router = new Router(app,'/ali',(req, res, dynamicpar) => {
//         res.write("<h1>ALi is  here  </h1>");
//     })
//"<h1>ALi is  here " + dynamic["lilo"] + " " +dynamic['mimo'] + " "+ dynamic["pat"] + ' </h1>'
// router.addRoute("/ali",(req, res,dynamic ) => {
//         res.write("<h1>lilo is  here  </h1>");
//     },["GET"], ()=>{
//         console.log("|||||||||||||||||||||||||||")
//     })
// app.start()
module.exports.Neutrino = Neutrino;
module.exports.readhtmlfile = readhtmlfile;
module.exports.Response = _Response;
module.exports.Request = _Request;
module.exports.Router = Router;
module.exports.Route = Route;
