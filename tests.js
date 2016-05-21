'use strict';

const expect = require('chai').expect;
const use = require('./index').use;
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

    yield use(function() {
      values.push('A');
    }).use(function() {
      this.stop();
    }).use(function() {
      values.push('B');
    })(botArgumentsMock);

    expect(values.join('')).to.equal('A');
  });
});
