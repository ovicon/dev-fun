$ErrorActionPreference = 'Stop'
$oldGoos = $env:GOOS
$oldGoarch = $env:GOARCH
try {
    $env:GOARCH = 'amd64'
    $env:GOOS = 'windows'
    go build -trimpath -o (Join-Path $PSScriptRoot 'static-server-windows-amd64.exe') (Join-Path $PSScriptRoot 'server.go')
    if ($LASTEXITCODE -ne 0) { throw 'Windows build failed.' }

    $env:GOOS = 'linux'
    go build -trimpath -o (Join-Path $PSScriptRoot 'static-server-linux-amd64') (Join-Path $PSScriptRoot 'server.go')
    if ($LASTEXITCODE -ne 0) { throw 'Linux build failed.' }
}
finally {
    $env:GOOS = $oldGoos
    $env:GOARCH = $oldGoarch
}
