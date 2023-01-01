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

