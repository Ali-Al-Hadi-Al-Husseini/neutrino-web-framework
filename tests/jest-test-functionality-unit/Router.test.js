'use strict'
const lib = require('../../build/Neutrino');
const Router = lib.Router
const Neutrino = lib.Neutrino

describe('Router', () => {
  let app, router;

  beforeEach(() => {
    app = new Neutrino();
    router = new Router(app, '/');
  });

  test('should set main route correctly', () => {
    expect(router._mainRoute.route).toBe('/');
  });

  test('should add route correctly', () => {
    router.addRoute('/test', () => {}, ['GET']);
    expect(router._mainRoute.children[0].route).toBe('/test');
  });

  test('should add dynamic route correctly', () => {
    router.addRoute('/<id>', () => {}, ['GET']);
    expect(router._mainRoute.dynamicRoute.route).toBe('/<id>');
  });

  test('should find last common route correctly', () => {
    router.addRoute('/test', () => {}, ['GET']);
    const lastCommonRoute = router._findLastCommon('/test/subroute', router._mainRoute);
    expect(lastCommonRoute.route).toBe('/test');
  });

  test('should continue route construction correctly', () => {
    const lastCommonRoute = router._findLastCommon('/', router._mainRoute);
    const finalRoute = router._continueConstruction(lastCommonRoute, '/test');
    expect(finalRoute.route).toBe('/');
  });
});