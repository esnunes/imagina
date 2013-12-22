
'use strict';

var os = require('os');
var path = require('path');
var async = require('async');
var spawn = require('child_process').spawn;

var Imagina = module.exports = function(opts) {
  opts = opts || {};

  this.opts = {
    workers: opts.workers || os.cpus().length,
    params: opts.params || []
  };

  var that = this;
  this.queue = async.queue(function(task, cb) {
    that._process(task, cb);
  }, this.opts.workers);

  this.cmds = {};

  this.resolutionVariable = /\{RESOLUTION\}/g;
};

Imagina.prototype.resize = function(src, dst, resolution, params, cb) {
  params = params || this.opts.params;

  var args = params.slice();
  if (args.length) {
    for (var i = 0, len = args.length; i < len; i++) {
      args[i] = args[i].replace(this.resolutionVariable, resolution);
    }
  }
  args.unshift(src);

  if (args.indexOf('-resize') === -1) args.push('-resize', resolution);

  args.push(typeof dst == 'function' ? dst(src, resolution, params) : dst);

  this._push(args, cb);
};

Imagina.prototype.resizeBatch = function(src, dst, resolutions, params, cb) {
  var that = this;

  async.each(resolutions, function(resolution, cb) {
    that.resize(src, dst, resolution, params, cb);
  }, cb);
};

Imagina.prototype.convert = function(src, dst, cb) {
  this._push([src, dst], cb);
};

Imagina.prototype._push = function(args, cb) {
  var key = args.join('');

  var cbs = this.cmds[key];
  if (typeof cbs == 'undefined') {
    this.cmds[key] = [];
    if (cb) this.cmds[key].push(cb);
    return this.queue.push({ args: args, key: key });
  }
  if (cb) cbs.push(cb);
  cbs.push(cb);
};

Imagina.prototype._process = function(task, cb) {
  var that = this;

  // empty callback
  var emptyCB = function() {};

  // modify destination file path to temporary file
  var dstPath = task.args[task.args.length - 1];
  var tmpPath = dstPath + '.tmp';
  task.args[task.args.length - 1] = tmpPath;

  // move from tmp to final destination path
  var moveFromTmp = function(code) {
    if (code !== 0) return notify(new Error('failed on convert'));

    spawn('mv', ['-f', tmpPath, dstPath]).on('close', function(code) {
      if (code !== 0) return notify(new Error('failed to move from ' + tmpPath + ' to ' + dstPath));
      notify();
    }).on('error', emptyCB);
  };

  // notify
  var notify = function(err) {
    var cbs = that.cmds[task.key];
    for (var i = 0, len = cbs.length; i < len; i++) {
      cbs[i](err);
    }
    delete that.cmds[task.key];
    cb();
  };

  var convert = spawn('convert', task.args);
  convert.on('error', emptyCB);
  convert.on('close', moveFromTmp);
};
