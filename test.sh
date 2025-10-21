$payload = @{
  to = "thecommodore300@gmail.com"
  subject = "PartyHause send flow test"
  html = "<p>Test email sent at $(Get-Date -Format o)</p>"
} | ConvertTo-Json

try {
  $resp = Invoke-WebRequest -Uri 'https://www.partyhause.com/api/email' -Method POST -Body $payload -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
  Write-Output "Status: $($resp.StatusCode)`nBody:`n$($resp.Content)"
} catch {
  Write-Output "Request failed: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    try {
      $_.Exception.Response.GetResponseStream() | ForEach-Object { [System.IO.StreamReader]::new($_).ReadToEnd() } | Write-Output
    } catch {
      $_.Exception.Response | Write-Output
    }
  }
}