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
    const use = require('use');
    
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
## How does it work

**use** - is just a function, that returns another function, that accepts middleware as arguments or object with
message data on bot.onText executiong. It also has .use method, that is just copy of function itself. Useful when
writing code like use(middleware).use(middleware)(yourCallbackFunction)

Basically you can write even like this:

```js
    use(middleware)(middleware).use(middleware)(botCallbackArguments); // botCallbackArguments will be passed by bot, and executed function will be also by bot.
```