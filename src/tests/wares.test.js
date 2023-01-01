const neutrino = require('../Neutrino');
const Ware = neutrino.ware

// const logger = logger()

// let waresResult = []


const mockRequest = {};
const mockResponse = {};
const mockLogger = {
  addError: jest.fn(),
};

let ware;

beforeEach(() => {
  ware = new Ware(mockLogger);
});

test('addWare adds a middleware function to the wares array', () => {
  const middleware = () => {};
  ware.addWare(middleware);
  expect(ware.wares).toContain(middleware);
});

test('startWares sets the request and response properties and calls next', () => {

  ware.startWares(mockRequest, mockResponse);
  expect(ware.request).toBe(mockRequest);
  expect(ware.response).toBe(mockResponse);

});

test('next calls the current middleware and increments the currentWareIdx', () => {
  const middleware = jest.fn();
  ware.wares = [middleware];
  ware.next();
  expect(middleware).toHaveBeenCalled();
  expect(ware.currentWareIdx).toBe(0);
});

test('next calls the reset method if currentWareIdx is greater than or equal to the length of the wares array', () => {
    const reset = jest.fn();
    ware.currentWareIdx = 1;
    ware.wares = [];
    ware.reset = reset;
    ware.next();
    expect(reset).toHaveBeenCalled();
  });
  
  test('reset sets the currentWareIdx to -1', () => {
    ware.reset();
    expect(ware.currentWareIdx).toBe(-1);
  });
  
  test('removeWare removes the specified middleware from the wares array', () => {
    const middleware = () => {};
    ware.addWare(middleware)
    ware.removeWare(middleware);
    expect(ware.wares).not.toContain(middleware);
  });
  
