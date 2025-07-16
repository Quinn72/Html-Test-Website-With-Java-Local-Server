Write-Host "=== Node.js Local Network Diagnostics ===" -ForegroundColor Cyan

# Check local IPv4 address
Write-Host "`n[INFO] Getting your local IPv4 address..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -notlike "127.*" -and $_.InterfaceAlias -notlike "*Virtual*" }).IPAddress

if ($ip) {
    Write-Host "[OK] Your local IP address is: $ip"
    Write-Host "     Try accessing: http://$ip:3000 from another device"
} else {
    Write-Host "[ERROR] Couldn't determine local IP. Are you connected to a network?" -ForegroundColor Red
}

# Check if Node.js is listening on port 3000
Write-Host "`n[INFO] Checking if port 3000 is listening..." -ForegroundColor Yellow
$netstat = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($netstat) {
    Write-Host "[OK] Port 3000 is being used by:" -ForegroundColor Green
    foreach ($conn in $netstat) {
        try {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction Stop
            Write-Host "   Port 3000 -> $($proc.ProcessName) (PID: $($proc.Id))"
        } catch {
            Write-Host "   Port 3000 -> Process not found (PID: $($conn.OwningProcess))"
        }
    }
} else {
    Write-Host "[WARN] Port 3000 is NOT in use. Start your Node server and run this again." -ForegroundColor Red
}

# Check if firewall has a rule allowing TCP 3000
Write-Host "`n[INFO] Checking if firewall allows TCP port 3000..." -ForegroundColor Yellow
$fwRule = Get-NetFirewallRule -Enabled True | Where-Object {
    ($_ | Get-NetFirewallPortFilter).Port -contains 3000
}

if ($fwRule) {
    Write-Host "[OK] Found firewall rule(s) allowing TCP 3000:" -ForegroundColor Green
    $fwRule | Format-Table DisplayName, Enabled, Direction, Action -AutoSize
} else {
    Write-Host "[ERROR] No firewall rule found for port 3000!" -ForegroundColor Red
    Write-Host "[TIP] You can add one using this command:" -ForegroundColor Yellow
    Write-Host "    New-NetFirewallRule -DisplayName `"Node Port 3000`" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000"
}

# Suggestions
Write-Host "`n[Suggestions]" -ForegroundColor Cyan
if (-not $netstat) {
    Write-Host "- Start your Node.js server first: node server.js"
}
if (-not $fwRule) {
    Write-Host "- Run the firewall rule command above if access is blocked from other devices."
}
Write-Host "- Make sure your phone is on the same Wi-Fi as this PC."
Write-Host "- Try temporarily disabling antivirus if connections still fail."

Write-Host "`n[Done] Let me know what the output says!" -ForegroundColor Green
