/*
 * This is an HTTP router following similar request parameters from the course
 * but with few improvements to avoid sub-routing functions and self-documentation
 */

const wildcardMethod = '*';

// Router object
function Router() {
    this.paths = {};

    // Default handler for not matching paths
    this.handlerNotFound = handlerNotFound;

    // Default handler for not matching methods
    this.handlerMethodNotAllowed = handlerMethodNotAllowed;
}

Router.prototype.path = function(path) {
  if (!(path in this.paths)) {
    this.paths[path] = new Resource(this);
  }
  return this.paths[path];
};

function isUrlParameter(s) {
  if (s[0] === '{') { // @TODO: check also the ending '}'
    return true;
  }
}

Router.prototype.match = function(method, path, urlParameters) {
  for (var pattern in this.paths) {

    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    var match = true;
    var parameters = {};
    for (var i in pathParts) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      if (isUrlParameter(patternPart)) {
        // Is a parameter: add to parameters object
        const patternPartTrimed = patternPart.substring(1, patternPart.length -1);
        parameters[patternPartTrimed] = pathPart;
      } else if (patternPart === pathPart) {
        // Part match (do nothing)
      } else {
        match = false;
        break;
      }
    }
    if (match) {
      for (var k in parameters) {
        urlParameters[k] = parameters[k];
      }
      return this.paths[pattern].match(method);
    }
  }
  return this.handlerNotFound;
};

// Resource object
function Resource(router) {
  this.router = router;
  this.methods = {};
}

Resource.prototype.method = function(method, handler, documentation) {
  this.methods[method] = handler;
  if (documentation) {
    handler.documentation = documentation;
  }
  return this;
};

Resource.prototype.match = function(method) {
  if (method in this.methods) {
    return this.methods[method];
  }

  if (wildcardMethod in this.methods) {
    return this.methods['*'];
  }

  return this.router.handlerMethodNotAllowed;
}

// Handler not found (when there is not a path match)
function handlerNotFound(req, callback) {
  callback(404, {
    error: `Resource '${req.path}' not found`,
  });
}

// Handler method not allowed (when there is not a method match)
function handlerMethodNotAllowed(req, callback) {
  callback(405, {
    error: `Method '${req.method}' not allowed here`,
  });
}

module.exports = {
  Router,
  handlerNotFound,
  handlerMethodNotAllowed,
  wildcardMethod,
};
