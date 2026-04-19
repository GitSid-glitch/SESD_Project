function json(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function noContent(res) {
  res.writeHead(204);
  res.end();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseQuery(url) {
  const [, queryString = ""] = url.split("?");
  return Object.fromEntries(new URLSearchParams(queryString).entries());
}

module.exports = {
  json,
  noContent,
  parseBody,
  parseQuery
};
