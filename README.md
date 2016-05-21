[![Build Status](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware.svg?branch=master)](https://travis-ci.org/idchlife/node-telegram-bot-api-middleware)

Using middleware for node-telegram-bot-api from yagop: https://github.com/yagop/node-telegram-bot-api

## Why?
So, you happened to be here. And I assume you like writing telegram bots using **yagop**-s library node-telegram-bot-api.
But sometimes you end making multiple promises, generators by hand, async/await constructions and all that.
I present you the way of using power of generators and **co** library by **tj** by adding middleware before executing bot message callback

## Installation

    npm i node-telegram-bot-api-middleware --save

    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(TOKEN, { polling: true });
    const use = require('use');