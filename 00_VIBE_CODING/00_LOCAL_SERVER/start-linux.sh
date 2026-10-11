#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: $0 <html-folder> [port]" >&2
    exit 2
fi

html_dir=$1
port=${2:-8000}
if [ ! -d "$html_dir" ]; then
    echo "HTML folder does not exist or is not a directory: $html_dir" >&2
    exit 2
fi
case "$port" in
    ''|*[!0-9]*) echo "Port must be a number from 1 to 65535" >&2; exit 2 ;;
esac
if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
    echo "Port must be a number from 1 to 65535" >&2
    exit 2
fi

html_dir=$(CDPATH= cd -- "$html_dir" && pwd -P)
server_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
server="$server_dir/static-server-linux-amd64"
if [ ! -x "$server" ]; then
    echo "Linux server executable is missing or not executable: $server" >&2
    exit 2
fi

exec "$server" "$html_dir" "$port"
