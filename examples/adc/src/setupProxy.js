// import proxy from "http-proxy-middleware";
var proxy = require("http-proxy-middleware");

var devProxy = proxy("/axapi/v3/**", {
  target: "https://192.168.105.99",
  secure: false,
  onProxyReq: function(proxyReq, req, res) {
    console.log(req, "on request");
    // req["Content-type"] = "applicaton/json";
  },
  onProxyRes: function(proxyRes, req, res) {
    console.log(res, "on response ");
  },
  onError: function(error, req, res) {
    console.log(error);
  }
});

module.exports = function(app) {
  app.use(devProxy);
};
