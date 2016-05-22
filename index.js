'use strict';

const co = require('co');

/**
 * Checking if fn is generator
 */
function isGenerator(fn) {
  return Object.getPrototypeOf(fn) === Object.getPrototypeOf(function* () {});
}

/**
 * This is default middleware, that adds handy functionality to context for
 * other middlewares to use
 */
function defaultMiddleware(msg) {
  this.msg = msg;
  this.chatId = msg.chat.id;

  this.shouldStop = false;

  /**
   * Function that stops stepping into another middleware. Useful for stopping
   * if e.g. there is logical error or auth error etc.
   */
  this.stop = () => {
    this.shouldStop = true;
  };
}

/**
 * This is the main function that is used for creating context with .use and
 * returning function that also can add middleware or execute middleware if
 * bot object passed in arguments
 *
 * @param middleware
 * @returns {function(this:{middlewares})}
 */
const use = function use(middleware) {
  /**
   * Copying context, so middleware will be added only in returned callback,
   * and won't be added to global context of this function
   */
  const copy = {
    middlewares: this.middlewares.slice()
  };

  /**
   * Adding new middlewares
   */
  copy.middlewares.push(middleware);

  /**
   * Binding callback to new context, so middlewares will be available
   */
  const callback = botCallback.bind(copy);

  /**
   * Adding use method and binding it co copy context, so context will
   * be saved for further usage
   */
  callback.use = use.bind(copy);

  return callback;
}.bind({
  middlewares: []
});
/**
 * First time binding to object with middlewares, so `this` context will be as
 * we expected
 */

const botCallback = function botCallback() {
  const args = arguments;

  /**
   * If arguments length is positive and first arguments
   * is function, then callback for bot message is added
   */
  if (args.length && typeof args[0] === 'function') {
    const copy = {
      middlewares: this.middlewares.slice()
    };

    copy.middlewares.push(args[0]);

    const callback = botCallback.bind(copy);
    callback.use = use.bind(copy);

    return callback;
  }

  /**
   * Check if there is msg.chat and msg.chat.id to ensure that everything is ok
   * when bot is executing function with arguments
   */
  if (!args.length) {
    console.error(
      '[node-telegram-bot-api-middleware]: No arguments passed ' +
      'to a function used in bot event callback or adding new middleware'
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

  /**
   * Context object, that will be modified by all middlewares
   */
  const context = {};

  /**
   * Adding default middleware before other middlewares
   */
  this.middlewares.unshift(defaultMiddleware);

  /**
   * Using co for executing generator, so we can use yield keyword
   */
  return co(function* executeMiddlewares() {
    for (let i = 0, size = this.middlewares.length; i < size; i++) {
      /**
       * Somewhere in middleware was activated .stop method. No need to execute
       * middlewares further
       */
      if (context.shouldStop) {
        return;
      }

      /**
       * Creating callback
       */
      const middleware = this.middlewares[i];

      /**
       * If middleware just a function, execute it without yield
       *
       *
       * Executing middleware with context object and args.
       * Args by this point is arguments passed by node-telegram-bot-api when
       * receiving new message from recipient
       */
      try {
        if (!isGenerator(middleware)) {
          middleware.apply(context, args);
        } else {
          yield middleware.apply(context, args);
        }
      } catch (err) {
        /**
         * If middleware that had error has onErrorHandler in it,
         * pass error to it also
         */
        if (typeof middleware.onErrorHandler === 'function') {
          middleware.onErrorHandler(err);
        }

        /**
         * We want error to pass to main handler also,
         * so it won't be lost
         */
        throw err;
      }
    }
  }.bind(this)).catch(onErrorHandler);
};

/**
 * Default error handler to handle errors in middleware.
 * It will only console.errors
 *
 * @param error
 */
const onErrorHandlerDefault = (error) => {
  console.error('[node-telegram-bot-api-middleware]: Error occured in the middleware: ');
  console.error(error);
};

let onErrorHandler = onErrorHandlerDefault;

/**
 * You can set your own handler of all errors
 * @param onError
 */
exports.setOnErrorHandler = (onError) => {
  /**
   * OnError must be a function that does something
   */
  if (typeof onError !== 'function') {
    console.error(
      '[node-telegram-bot-api-middleware]: ' +
      'onErrorHandler must be function. Not setting.'
    );
  } else {
    onErrorHandler = onError;
  }
};

exports.getDefaultErrorHandler = () => onErrorHandlerDefault;

/**
 * Reset error handler to default. For testing and various purposes
 */
exports.resetErrorHandler = () => {
  onErrorHandler = onErrorHandlerDefault;
};

exports.use = use;
