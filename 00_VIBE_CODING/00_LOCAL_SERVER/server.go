package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func main() {
	if len(os.Args) < 2 || len(os.Args) > 3 {
		log.Fatalf("usage: %s <html-folder> [port]", filepath.Base(os.Args[0]))
	}

	root, err := filepath.Abs(os.Args[1])
	if err != nil {
		log.Fatalf("resolve HTML folder: %v", err)
	}
	root, err = filepath.EvalSymlinks(root)
	if err != nil {
		log.Fatalf("HTML folder does not exist: %v", err)
	}
	info, err := os.Stat(root)
	if err != nil || !info.IsDir() {
		log.Fatalf("HTML folder is not a directory: %s", root)
	}

	port := 8000
	if len(os.Args) == 3 {
		port, err = strconv.Atoi(os.Args[2])
		if err != nil || port < 1 || port > 65535 {
			log.Fatal("port must be a number from 1 to 65535")
		}
	}

	address := fmt.Sprintf("127.0.0.1:%d", port)
	log.Printf("Serving %s at http://%s/", root, address)
	log.Fatal(http.ListenAndServe(address, secureFiles(root)))
}

func secureFiles(root string) http.Handler {
	files := http.FileServer(http.Dir(root))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// FileServer cleans URL paths; check the resolved filesystem path too, so
		// symlinks inside the document root cannot expose files outside it.
		requested := filepath.Join(root, filepath.FromSlash(strings.TrimLeft(r.URL.Path, "/")))
		resolved, err := filepath.EvalSymlinks(requested)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		rel, err := filepath.Rel(root, resolved)
		if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		files.ServeHTTP(w, r)
	})
}
