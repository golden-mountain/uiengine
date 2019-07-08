import proxy from "http-proxy-middleware";

const devProxy = proxy("/api/v3/", {
  target: "http://192.168.105.99/axapi/v3/",
  onProxyReq: function(proxyReq: any, req: any, res: any) {
    proxyReq.setHeader("Content-type", "applicaton/json");
  },
  onProxyRes: function(proxyRes: any, req: any, res: any) {
    console.log(res);
  }
});

module.exports = function(app: any) {
  app.use(devProxy);
};
