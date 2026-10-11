param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$HtmlDirectory,
    [Parameter(Position = 1)]
    [ValidateRange(1, 65535)]
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$resolved = Resolve-Path -LiteralPath $HtmlDirectory -ErrorAction SilentlyContinue
if (-not $resolved -or -not (Test-Path -LiteralPath $resolved.Path -PathType Container)) {
    Write-Error "HTML folder does not exist or is not a directory: $HtmlDirectory"
    exit 2
}

$server = Join-Path $PSScriptRoot 'static-server-windows-amd64.exe'
if (-not (Test-Path -LiteralPath $server -PathType Leaf)) {
    Write-Error "Windows server executable is missing: $server"
    exit 2
}

& $server $resolved.Path $Port
exit $LASTEXITCODE
