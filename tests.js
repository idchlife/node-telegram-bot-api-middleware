'use strict';

const expect = require('chai').expect;
const middleware = require('./index');
const use = middleware.use;
require('co-mocha');

const botArgumentsMock = {
  chat: {
    id: 1
  }
};

describe('basic middleware usage', () => {
  it('should return function', () => {
    expect(use(() => {})).to.be.a('function');
  });

  const integratedValues = [];

  it('should execute middlewares in proper order', function* () {
    yield use(() => {
      integratedValues.push('A');
    }).use(() => {
      integratedValues.push('B');
    }).use(function* gen1() {
      integratedValues.push('C');
    }).use(function* gen2() {
      integratedValues.push('D');
    })(botArgumentsMock);

    expect(integratedValues.join('')).to.equal('ABCD');
  });

  it('should have properties from default middleware', function* () {
    let thereIsMsg = false;
    yield use(function () {
      thereIsMsg = typeof this.msg !== 'undefined';
    })(botArgumentsMock);

    expect(thereIsMsg).to.equal(true);
  });

  it('should have new middlewares and not have old used, when using use() from scratch', function* () {
    yield use(() => {
      integratedValues.push('E');
    })(botArgumentsMock);

    // If test result would be false - value would be ABCDABCDE
    expect(integratedValues.join('')).to.equal('ABCDE');
  });

  it('should stop executing middleware when .stop() is used', function* () {
    const values = [];

    yield use(function() {
      this.stop();
    }).use(() => {
      values.push('A');
    })(botArgumentsMock);

    expect(values).to.be.empty;

    yield use(function () {
      values.push('A');
    }).use(function () {
      this.stop();
    }).use(function () {
      values.push('B');
    })(botArgumentsMock);

    expect(values.join('')).to.equal('A');
  });

  it('should work properly with alternative syntax', function* () {
    const v = [];

    yield use(() => v.push('A')).use(() => v.push('B'))(() => v.push('C'))(botArgumentsMock);

    expect(v.join('')).to.equal('ABC');

    yield use(() => v.push('D'))(function() { this.stop(); })(() => v.push('E'))(botArgumentsMock);

    expect(v.join('')).to.equal('ABCD');
  });
  
  it('should properly throw errors and also pass it to middleware error handler', function* () {
    let wasThereError = false;
    let middlewareErrorHandlerWorked = false;

    function customErrorHandler(err) {
      throw err;
    }

    function middlewareWithErrorHandler() {
      this.undefinedMethod();
    }

    middlewareWithErrorHandler.onErrorHandler = function() {
      middlewareErrorHandlerWorked = true;
    };
    
    middleware.setOnErrorHandler(customErrorHandler);
    
    try {
      yield use(middlewareWithErrorHandler)(botArgumentsMock);
    } catch (err) {
      wasThereError = true;
    } finally {
      expect(wasThereError).to.equal(true);
      expect(middlewareErrorHandlerWorked).to.equal(true);
    }
  });

  it('should properly pass copied context and not affect previous middlewares', function* () {
    const values = [];

    const def = use(() => {
      values.push('Z');
    });

    const a = def.use(() => {
      values.push('A');
    });

    const b = def.use(() => {
      values.push('B');
    });

    const c = b.use(() => {
      values.push('C');
    });

    yield a(botArgumentsMock);
    yield b(botArgumentsMock);

    expect(values.join('')).to.equal('ZAZB');

    yield c(botArgumentsMock);

    expect(values.join('')).to.equal('ZAZBZBC');
  });
});
