// import proxy from "http-proxy-middleware";
var proxy = require("http-proxy-middleware");

var devProxy = proxy("/axapi/v3/**", {
  target: "https://192.168.105.99",
  secure: false,
  onProxyReq: function(proxyReq, req, res) {},
  onProxyRes: function(proxyRes, req, res) {},
  onError: function(error, req, res) {}
});

module.exports = function(app) {
  app.use(devProxy);
};
