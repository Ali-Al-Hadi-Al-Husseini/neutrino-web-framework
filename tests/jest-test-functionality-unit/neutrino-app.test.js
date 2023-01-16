'use strict'
const lib = require('../../build/Neutrino');
const Neutrino = lib.Neutrino

describe('Neutrino', () => {
    let neutrino;
    beforeEach(() =>{
        neutrino = new Neutrino()
    })
    it('should initialize with default values', () => {

      expect(neutrino._port).toEqual(5500);
      expect(neutrino._mainDynammic).toBeNull();
      expect(neutrino._log).toBeFalsy();

    });
  
    it('should allow adding routes for different HTTP methods', () => {

      neutrino.get('/', () => {});
      neutrino.post('/', () => {});
      neutrino.put('/', () => {});
      neutrino.delete('/', () => {});
        
      let methods = Object.keys(neutrino._routesobjs['/'].methodsFuncs)
      expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);

    });
  
    it('should allow adding middlewares and afterwares', () => {

      const middleware1 = jest.fn();
      const middleware2 = jest.fn();
      const afterware1 = jest.fn();
      const afterware2 = jest.fn();
  
      neutrino.use(middleware1);
      neutrino.addMiddlWare(middleware2);
      neutrino.addAfterWare(afterware1);
      neutrino.addAfterWare(afterware2);
  
      expect(neutrino._middlewares.wares).toEqual([middleware1, middleware2]);
      expect(neutrino._afterware.wares).toEqual([afterware1, afterware2]);
    });

    test('should log a message', () => {
    const spy = jest.spyOn(neutrino._logger, 'log');
    neutrino.log('Test log message');
    expect(spy).toHaveBeenCalledWith('Test log message');
    });

    test('should disable logging', () => {
    neutrino.disableLogging();
    expect(neutrino._logger.enabled).toBe(false);
    });

    test('should enable logging', () => {
    neutrino.disableLogging();
    neutrino.enableLogging();
    expect(neutrino._logger.enabled).toBe(true);
    });

    test('should skip middlewares', () => {
    neutrino._middlewares.wares = [jest.fn(), jest.fn(), jest.fn()];
    neutrino.skipMiddlewares();
    expect(neutrino._middlewares.currentWareIdx).toBe(3);
    });

    test('should skip afterwares', () => {

    neutrino._afterware.wares = [jest.fn(), jest.fn(), jest.fn()];
    neutrino.skipAfterwares();
    expect(neutrino._afterware.currentWareIdx).toBe(3);

    });

})  