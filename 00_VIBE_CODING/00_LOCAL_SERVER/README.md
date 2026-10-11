# Static HTML server

This folder contains a small static file server and launch scripts for 64-bit Windows and Linux. The server uses only Go's standard library. The included native executable means Go or another runtime is not needed on machines that run it.

The server listens on `127.0.0.1` and defaults to port `8000`. It serves `index.html` for directories that contain one and shows a file listing for directories without one.

## Windows

From PowerShell:

```powershell
..\start-windows.ps1 C:\path\to\html [port]
```

## Linux

```sh
sh ./start-linux.sh /path/to/html [port]
```

The HTML folder is required. The port is optional and must be between 1 and 65535.

## Rebuilding the executables

With Go installed, run `./build.ps1` from PowerShell. This cross-compiles both x64 executables.
