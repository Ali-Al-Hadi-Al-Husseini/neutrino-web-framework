const neutrinoRequest = require('../../build/Neutrino').neutrinoRequest;

describe('neutrinoRequest', () => {
  it('should extract the parameters from the URL', () => {
    const req = new neutrinoRequest({});
    expect(req.parseParams('param1=value1&param2=value2')).toEqual({ param1: 'value1', param2: 'value2' });
  });

  it('should extract the IP address of the client', () => {
    const req = new neutrinoRequest({
      remoteAddress: '123.456.789.123',
    });
    expect(req.ip).toEqual('123.456.789.123');
  });

  it('should parse the cookies from the header', () => {
    const req = new neutrinoRequest({});
    req.headers =  {
        cookie: 'cookie1=value1; cookie2=value2',
      }
    req.cookies = req.parseCookies() 
    expect(req.cookies).toEqual({ cookie1: 'value1', cookie2: 'value2' });
  });

  it('should return the value of the specified header', () => {
    const req = new neutrinoRequest({});
    req.headers = {
        header1: 'value1',
        header2: 'value2',
      }
    expect(req.get('header1')).toEqual('value1');
    expect(req.get('header2')).toEqual('value2');
  });
});