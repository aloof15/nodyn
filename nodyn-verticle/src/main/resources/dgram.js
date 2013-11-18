var udp          = require('vertx/datagram');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

Socket = function(type, callback) {
  var that = this;
  var ipv4 = true;
  if (type === 'udp6') {
    ipv4 = false;
  }

  // if a callback is provided, set it up as the message listener
  if (callback) {
    that.on('message', callback);
  }

  var delegate = new udp.DatagramSocket(ipv4);
  var inetAddress; // underlying Java object

  delegate.dataHandler(function(packet) {
    // TODO: Should we wrap the data in a buffer?
    that.emit('message', packet.data, packet.sender);
  });

  this.bind = function(port, host, callback) {
    switch(typeof host) {
      case 'function':
        callback = host;
        host = '0.0.0.0';
        break;
      case 'undefined':
        host = '0.0.0.0';
        break;
    }
    if (callback) {
      that.on('listening', callback);
    }

    delegate.exceptionHandler(function(err) {
      that.emit('error', err);
    });

    delegate.dataHandler(function(packet) {
      that.emit('message', packet.data, {address: packet.sender, bytes: packet.data.length()});
    });

    delegate.listen(port, host, function() {
      that.emit('listening');
    });
  };

  this.close = function() {
    delegate.close(function() {
      that.emit('close');
    });
  };

  this.address = function() {
    localAddr =  delegate.localAddress();
    return localAddr;
  };

  this.setBroadcast = function(flag) {
    delegate.broadcast(flag);
  };

  this.setMulticastTTL = function(ttl) {
    delegate.setMulticastTimeToLive(ttl);
  };

  this.setTTL = this.setMulticastTTL;

  this.setMulticastLoopback = function(loopback) {
    delegate.multicastLoopbackMode(loopback);
  }
};


util.inherits(Socket, EventEmitter);

module.exports.createSocket = createSocket = function(type, callback) {
  return new Socket(type, callback);
};

module.exports.Socket = Socket;
