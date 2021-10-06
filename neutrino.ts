const http = require("http");
const fs = require('fs');

class Neutrino{
    _server;
    _port:number;
    _routes:string[];
    _routesFuncs: {};
    _routesMethods: {};
    constructor(port: number){
        this._server = http.createServer();
        this._port   = port;

    }
    route(url: string, routeFunc:Function,methods: string[]= ["get"]):void{
        this._routes.push(url);
        this._routesMethods[url] = methods;
        this._routesFuncs[url] = routeFunc;
    }

    start(port: number = this._port):void {
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live on port: " + this._port)

        this._server.on('request', (request, response) => {
            if (request.url in this._routes){

            }else{
                response.Head(404)
            }
          });
          
    }

    

}


const app = new Neutrino(5000);
app.start()