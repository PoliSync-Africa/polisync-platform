const http = require("http");

const PORT = 5000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify({
      app: "POLISYNC AFRICA",
      status: "Authentication Server Running"
    })
  );
});

server.listen(PORT, () => {
  console.log(`POLISYNC server running on port ${PORT}`);
});
