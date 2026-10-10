param(
  [Parameter(Mandatory = $true)]
  [string]$BackendPath
)

$ErrorActionPreference = 'Stop'
$frontendRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = (Resolve-Path -LiteralPath $BackendPath).Path
$webAppRoot = Join-Path $backendRoot 'src\main\webapp'
$reactBuild = Join-Path $frontendRoot 'dist'
$landingHtml = Join-Path $reactBuild 'index.html'
$reactHtml = Join-Path $reactBuild 'react-app.html'
$reactAssets = Join-Path $reactBuild 'assets'
$tomcatApp = Join-Path $webAppRoot 'app'

if (-not (Test-Path (Join-Path $backendRoot 'pom.xml'))) {
  throw "BackendPath must point to the seekora-backend project: $backendRoot"
}
if (-not (Test-Path $webAppRoot)) {
  throw "Backend web application directory was not found: $webAppRoot"
}

Push-Location $frontendRoot
try {
  & npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

if (-not (Test-Path $landingHtml) -or -not (Test-Path $reactHtml) -or -not (Test-Path $reactAssets)) {
  throw 'The frontend build did not produce the landing page, React app entry, and assets.'
}

$tomcatAssets = Join-Path $tomcatApp 'assets'
New-Item -ItemType Directory -Path $tomcatAssets -Force | Out-Null
Copy-Item -LiteralPath $landingHtml -Destination (Join-Path $webAppRoot 'index.html') -Force
Copy-Item -LiteralPath $reactHtml -Destination (Join-Path $tomcatApp 'index.html') -Force
Copy-Item -Path (Join-Path $reactAssets '*') -Destination $tomcatAssets -Force

Push-Location $backendRoot
try {
  & mvn package
  if ($LASTEXITCODE -ne 0) {
    throw "Backend WAR build failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Write-Output "Tomcat WAR created: $(Join-Path $backendRoot 'target\seekora.war')"
