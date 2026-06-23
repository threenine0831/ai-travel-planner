from __future__ import annotations

import mimetypes
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class StaticHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html; charset=utf-8",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("text/javascript", ".mjs")
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    frontend_dir = Path(__file__).resolve().parent / "frontend"
    if frontend_dir.exists():
        os.chdir(frontend_dir)
    server = ThreadingHTTPServer(("127.0.0.1", port), StaticHandler)
    print(f"Serving AI 여행 일정 플래너 at http://127.0.0.1:{port}/index.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
