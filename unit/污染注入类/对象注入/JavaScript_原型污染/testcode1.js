const Busboy = require('busboy');
const processNested = require('./processNested');
busboy.on('finish', () => {
    debugLog(options, `Busboy finished parsing request.`);
    if (options.parseNested) {
      req.body = processNested(req.body); //here
      req.files = processNested(req.files);
    }

    if (!req[waitFlushProperty]) return next();
    Promise.all(req[waitFlushProperty])
      .then(() => {
        delete req[waitFlushProperty];
        next();
      }).catch(err => {
        delete req[waitFlushProperty];
        debugLog(options, `Error while waiting files flush: ${err}`);
        next(err);
      });
  });