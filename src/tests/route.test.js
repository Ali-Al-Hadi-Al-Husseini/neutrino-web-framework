const Route = require('../neutrino').Route;


describe('Route', () => {

  let routes;
  let urls;
  let methods
  let testRouteFunc;

  beforeEach(() => {
    routes = []
    urls = ['/route','/main','/<dynamic>','/st/hello','/place']
    methods = [['GET',"POST"],['GET'],['POST','PUT'],['GET',"POST",'PUT'],['GET',"POST",'PUT','DELETE']]
    testRouteFunc = ()=>{}

    for(let idx = 0 ; idx < urls.length ; idx++){
        routes.push(new Route(urls[idx],testRouteFunc,methods[idx]))
    }

  });

  test('constructor sets correct properties', () => {
    for(let idx = 0 ; idx < urls.length ; idx++){
        let route = routes[idx]
        let currentMethods = methods[idx]
        let currentUrl = urls[idx]
        
        
        expect(route.children).toEqual([]);
        expect(route.route).toEqual(currentUrl);
        expect(route.methods).toEqual(currentMethods);
        expect(route.fullRoute).toEqual(currentUrl);
        expect(route.isDynamic).toEqual(idx == 2);
        expect(route.parent).toBeNull();
        expect(route.dynamicRoute).toBeNull();

        let methodsFuncs = {}
        for(const method of currentMethods){methodsFuncs[method] = testRouteFunc}

        expect(route.methodsFuncs).toEqual(methodsFuncs);
    }
  });

  test('populateMethodsFuncs returns correct object', () => {
    for(let idx = 0 ; idx < urls.length ; idx++){
        let route = routes[idx]
        let currentMethods = methods[idx]

        let methodsFuncs = {}
        for(const method of currentMethods){ methodsFuncs[method] = expect.any(Function)}

         expect(route.populateMethodsFuncs(() => {})).toEqual(methodsFuncs);
    }
});

test('addMethod adds method to methods and methodsFuncs', () => {
for(let idx = 0 ; idx < urls.length ; idx++){
    let route = routes[idx]
    let currentMethods = methods[idx]

    let testFunc = ()=> {}
    if(!"POST" in currentMethods) currentMethods.push("POST")

    route.addMethod('POST', testFunc);
    expect(route.methods).toEqual(currentMethods);
    expect(route.methodsFuncs['POST']).toEqual(testFunc);
}
});

test('addChild adds child to children array', () => {
    for(let idx = 0 ; idx < urls.length ; idx++){
        let route = routes[idx]
        let childs = routes.slice(idx+1)
        let dynamic;
    
        for (const child of childs){
            if (child.isDynamic) dynamic = child
            route.addChild(child);
    
        }
        const index = childs.indexOf(dynamic);
        if (index > -1) {
            childs.splice(index, 1);
        }
        
        expect(route.children).toEqual(childs);
    }
    })
    
    test('setParent sets correct parent and fullRoute', () => {
    const parent = new Route('/parent', () => {});
    
    for( const route of routes){
        route.setParent(parent);
        expect(route.parent).toEqual(parent);
        expect(route.fullRoute).toEqual(parent.fullRoute + route.route);
        expect(parent.children).toContain(route)
    }
    
    expect(parent.children).toEqual(routes)
    
    });
    test('setFullRoute sets correct fullRoute', () => {
    for(const route of routes){
        route.setFullRoute('/new/full/route');
        expect(route.fullRoute).toEqual('/new/full/route');
    }
    });
    
    test('setDynamicRoute sets correct parent and fullRoute', () => {
    const dynamicRoute = new Route('/<dynamic>', () => {});
    
    for(const route of routes){
        route.setDynamicRoute(dynamicRoute);
        expect(route.dynamicRoute).toEqual(dynamicRoute);
        expect(dynamicRoute.parent).toEqual(route);
        expect(dynamicRoute.fullRoute).toEqual(route.fullRoute + dynamicRoute.route);
    }
    
    });
    
    test('compareRoutes returns correct route and dynamic parts', () => {
    const child1 = new Route('/child1', () => {});
    const child2 = new Route('/child2', () => {});
    const dynamicRoute = new Route('/<dynamic>', () => {});
    child1.addChild(child2);
    
    for(const route of routes){
        route.addChild(child1);
        route.addChild(dynamicRoute);
    
        expect(route.compareRoutes(route.fullRoute + '/child1')).toEqual([child1, {}]);
        expect(route.compareRoutes(route.fullRoute +'/dynamic')).toEqual([dynamicRoute, { dynamic: 'dynamic' }]);
        expect(route.compareRoutes(route.fullRoute +'/child1/child2')).toEqual([child2, {}]);
    
    }
    })
})