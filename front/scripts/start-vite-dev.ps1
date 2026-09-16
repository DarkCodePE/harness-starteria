$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'vite-dev.out.log'
$Err = Join-Path $Root 'vite-dev.err.log'

Start-Process `
  -FilePath 'npm.cmd' `
  -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173') `
  -WorkingDirectory $Root `
  -RedirectStandardOutput $Out `
  -RedirectStandardError $Err `
  -WindowStyle Hidden
