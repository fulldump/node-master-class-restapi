/*
 * This is an HTTP router following similar request parameters from the course
 * but with few improvements to avoid sub-routing functions and self-documentation
 */

const wildcardMethod = '*';

// Router object
function Router() {
    this.paths = {};
}

Router.prototype.path = function(path) {
  if (!(path in this.paths)) {
    this.paths[path] = new Resource();
  }
  return this.paths[path];
};

Router.prototype.match = function(method, path) {
  for (var pattern in this.paths) {
    if (pattern == path) {
      return this.paths[pattern].match(method);
    }
  }
  return null;
};

// Resource object
function Resource() {
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

  return null;
}

module.exports = Router;
