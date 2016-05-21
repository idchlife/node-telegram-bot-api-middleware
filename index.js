'use strict';

const co = require('co');

/**
 * Default context object to start with
 *
 * @type {{middlewares: Array}}
 */
const propertiesObject = {
  middlewares: []
};

function defaultMiddleware(msg) {
  this.msg = msg;
  this.shouldStop = false;

  this.stop = () => {
    this.shouldStop = true;
  };
}

const botCallback = function botCallback() {
  const args = arguments;

  // Check if there is msg.chat.id so caller is message to bot
  if (!args.length) {
    console.error(
      '[node-telegram-bot-api-middleware]: No arguments passed ' +
      'to a function used in bot event callback'
    );
    return;
  }

  if (typeof args[0].chat === 'undefined') {
    console.error(
      '[node-telegram-bot-api-middleware]: Chat id not ' +
      'defined in arguments. Not executing middlewares'
    );

    return;
  }

  if (typeof args[0].chat.id === 'undefined') {
    console.error(
      '[node-telegram-bot-api-middleware]: There is no ' +
      'visible chat id in chat in arguments. Not executing middlewares'
    );
    return;
  }

  const context = {
    msg: args[0]
  };

  this.middlewares.unshift(defaultMiddleware);

  return co(function* executeMiddlewares() {
    for (let i = 0, size = this.middlewares.length; i < size; i++) {
      if (context.shouldStop) {
        return;
      }

      const middleware = co.wrap(this.middlewares[i]);

      yield middleware.apply(context, args);
    }
  }.bind(this));
};

function copyContextWithConcatenation(oldContext) {
  return {
    middlewares: oldContext.middlewares.slice()
  };
}

/**
 * @param middleware
 * @returns {function(this:{middlewares})}
 */
const use = function use(middleware) {
  /**
   * @type {Object} [middlewares]
   */
  const copy = copyContextWithConcatenation(this);

  copy.middlewares.push(middleware);

  const callback = botCallback.bind(copy);

  callback.use = use.bind(copy);

  return callback;
}.bind(propertiesObject);

exports.use = use;
