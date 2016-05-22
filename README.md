[![Build Status](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware.svg?branch=master)](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware)

Using middleware for node-telegram-bot-api from yagop: https://github.com/yagop/node-telegram-bot-api

## Why?
So, you happened to be here. And I assume you like writing telegram bots using **yagop**-s library node-telegram-bot-api.
But sometimes you end making multiple promises, generators by hand, async/await constructions and all that.
I present you the way of using power of generators and **co** library by **tj** by adding middleware before executing bot message callback

## Installation

    npm i node-telegram-bot-api-middleware --save

Then you can use it like this:

```js
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(TOKEN, { polling: true });
    const use = require('node-telegram-bot-api-middleware').use;
    
    // Simple middleware that adds random method to your context
    function randomMiddleware() {
      this.random = (number) => Math.floor(Math.random() * number)
    }
    
    let response = use(randomMiddleware);
    
    bot.onText(/\/command/, response(function() {
      bot.sendMessage(this.chatId, this.random(10));
    });
    
    // or
    response = response.use(function() {
      bot.sendMessage(this.chatId, this.random());
    });
    
    bot.onText(/\/command/, response);
    
    // or
    
    response = response(function() {
      bot.sendMessage(this.chatId, this.random());
    });
    
    bot.onText(/\/command/, response);
```

## Available at the moment middleware
 -

## Usage

```js
  const use = require('node-telegram-bot-api-middleware').use;
  // Your configured bot
  const bot = require('./bot');
  
  // You can use simple functions
  function middleware2() {
    // You will already have msg, chatId in context. This is achieved by added already inside
    // library default middleware, that populates context with those things, as well as method .stop()
    // (see further down about .stop)
    
    this.quickResponse = function* (text) {
      yield bot.sendMessage(this.chatId, text);
    }.bind(this);
  }
  
  // You can use generators
  function* middleware2() {
    yield this.quickResponse('You wrote something to this bot!');
    
    console.log('Answer sent');
  }
  
  // You cannot use short functions if you're going to use context passed from
  // previous middleware. `This wont't work: `
  const notWorkingResponse = use(() => { console.log(this.msg.chat.id); });
  
  // Be aware of adding middlewares in proper order,
  // because they will be executed in order in which you added them
  const response = use(middleware).use(middleware2);
  
  // You can also add more middleware to variable that already has set of middlewares
  // Adding more, it will create new set of middleware, not affecting old set of
  // middlewares. response still will have 2 middlewares.
  const checkAuth = response.use(function() {
    // Imagine, this also can be method from other middleware,
    // e.g.: this.isAuthenticated()
    const userIsAuthenticated = false;
    
    if (!userIsAuthenticated) {
      this.quickResponse('You are not authenticated to do that');
      
      // If you want to prevent executing next middlewares, use .stop()
      this.stop();
    }
  });
  
  bot.onText(/\/need_auth/, checkAuth(function() {
    // Give some info only to authenticated user
  }));
```

### Handling errors.

Default error handler built in will console.error all errors from middleware and proceed to next one.

You can also set your own global error handler like this (WARNING: this will replace default error handler, if you need to combine default handler with your - use middleware.getDefaultErrorHandler()):

```js
  const middleware = require('middleware');
  const use = middleware.use;
  
  middleware.setErrorHandler(err => {
    // Your own logic for handling errors
  });
```

Sometime you might need to set custom error handler to your middleware.
This done line this:

```js
  function yourCustomMiddleware() {
    this.methodWithPossibilityOfErrorOccuring();
  }
  
  yourCustomMiddleware.onErrorHandler = err => {
    // Log or do some other things with error
  }
```

## How does it work

**use** - is just a function, that returns another function, that accepts middleware as arguments or object with
message data on bot.onText executiong. It also has .use method, that is just copy of function itself. Useful when
writing code like use(middleware).use(middleware)(yourCallbackFunction)


Basically you can write even like this:

```js
    use(middleware)(middleware).use(middleware)(botCallbackArguments); // botCallbackArguments will be passed by bot, and executed function will be also by bot.
```

For more information on this topic look into index.js file. There are many comments explaining how does it work.


## Help yourself and everyone build better bots!

As you can see, this is cool opportunity to create many different middleware libraries for different purposes. For database connection, for special file uploaders or many other things. Join the opensource! (if you did not yet) Create middleware for some other libraries or for your special case and share with everyone! Create an issue or send pull request and I will add link to your middleware in the list.