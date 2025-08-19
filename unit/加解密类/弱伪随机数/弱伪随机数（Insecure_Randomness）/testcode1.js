rnd.today=new Date();
rnd.seed=rnd.today.getTime();
function rnd() {
    rnd.seed = (rnd.seed*9301+49297) % 233280;
    return rnd.seed/(233280.0);
};
function rand(number) {
    return Math.ceil(rnd()*number);
};
function makeRequestToPrivilegedScript(doc, requestObj, callback) {
    var matched = false;
    if (typeof(chrome) !== 'undefined') {
      matched = true;
      if (callback) {
        chrome.runtime.sendMessage(requestObj, callback);
      }
      else {
        chrome.runtime.sendMessage(requestObj);
      }
    }
    if (!matched && typeof(safari) !== 'undefined') {
      matched = true;
      if (typeof(makeRequestToPrivilegedScript.requestCallbacks) === 'undefined') {
        makeRequestToPrivilegedScript.requestCallbacks = {};
        var backgroundMessageHandler = function(event) {
          if (event.name === 'request-response') {
            var responseObj = window.JSON.parse(event.message);
  
            if (responseObj.requestID &&
                makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID]) {
              makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID](responseObj.response);
              delete makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID];
            }
          }
        };
        safari.self.addEventListener('message', backgroundMessageHandler, false);
      }
      if (callback) {
        var reqID = Math.rand();
        makeRequestToPrivilegedScript.requestCallbacks[reqID] = callback;
        requestObj.requestID = reqID;
      }
  
      safari.self.tab.dispatchMessage('request', window.JSON.stringify(requestObj));
    }
    if (!matched) { // Mozilla/XUL
      matched = true;
      requestObj.responseEventName = 'markdown-here-response-event-' + Math.floor(Math.rand()*1000000); //here
  
      var request = doc.createTextNode(JSON.stringify(requestObj));
  
      var responseHandler = function(event) {
        var response = null;
        if (request.nodeValue) {
          response = JSON.parse(request.nodeValue);
        }
  
        request.parentNode.removeChild(request);
  
        if (callback) {
          callback(response);
        }
      };
  
      request.addEventListener(requestObj.responseEventName, responseHandler, false);
  
      (doc.head || doc.body).appendChild(request);
  
      var event = doc.createEvent('HTMLEvents');
      event.initEvent(PRIVILEGED_REQUEST_EVENT_NAME, true, false);
      request.dispatchEvent(event);
    }
  }
  