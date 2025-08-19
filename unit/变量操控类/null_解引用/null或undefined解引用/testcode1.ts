'use strict'

const { AsyncResource } = require('async_hooks')
const lru = require('tiny-lru').lru

const secureJson = require('secure-json-parse')
const {
  kDefaultJsonParse,
  kContentTypeParser,
  kBodyLimit,
  kRequestPayloadStream,
  kState,
  kTestInternals,
  kReplyIsError,
  kRouteContext
} = require('./symbols')

const {
  FST_ERR_CTP_INVALID_TYPE,
  FST_ERR_CTP_EMPTY_TYPE,
  FST_ERR_CTP_ALREADY_PRESENT,
  FST_ERR_CTP_INVALID_HANDLER,
  FST_ERR_CTP_INVALID_PARSE_TYPE,
  FST_ERR_CTP_BODY_TOO_LARGE,
  FST_ERR_CTP_INVALID_MEDIA_TYPE,
  FST_ERR_CTP_INVALID_CONTENT_LENGTH,
  FST_ERR_CTP_EMPTY_JSON_BODY
} = require('./errors')

ContentTypeParser.prototype.getParser = function (contentType) {
  this.customParsers = {}
  this.customParsers['application/json'] = new Parser(true, false, bodyLimit, this[kDefaultJsonParse])
  this.customParsers['text/plain'] = new Parser(true, false, bodyLimit, defaultPlainTextParser)
  
  if (contentType in this.customParsers) {
    return this.customParsers[contentType] //here
  }


  return this.customParsers['']
}

ContentTypeParser.prototype.run = function (contentType, handler, request, reply) {
  const parser = this.getParser(contentType)
  const resource = new AsyncResource('content-type-parser:run', request)

  if (parser === undefined) {
    if (request.is404) {
      handler(request, reply)
    } else {
      reply.send(new FST_ERR_CTP_INVALID_MEDIA_TYPE(contentType || undefined))
    }
  } else if (parser.asString === true || parser.asBuffer === true) {
    rawBody(
      request,
      reply,
      reply[kRouteContext]._parserOptions,
      parser,
      done
    )
  } else {
    const result = parser.fn(request, request[kRequestPayloadStream], done) //here

    if (result && typeof result.then === 'function') {
      result.then(body => done(null, body), done)
    }
  }

  function done (error, body) {
    // We cannot use resource.bind() because it is broken in node v12 and v14
    resource.runInAsyncScope(() => {
      if (error) {
        reply[kReplyIsError] = true
        reply.send(error)
      } else {
        request.body = body
        handler(request, reply)
      }
    })
  }
}
/*
> curl -X POST http://127.0.0.1:3000 -H 'Content-Type: constructor'
*/
