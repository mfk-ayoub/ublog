"""
Minimal Alertmanager webhook receiver.

Listens on port 5001 and logs every alert payload it receives.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
from datetime import datetime, timezone


class WebhookHandler(BaseHTTPRequestHandler):
    """Handle POST /  —  Alertmanager webhook endpoint."""

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"invalid JSON")
            return

        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        status = payload.get("status", "unknown")
        alerts = payload.get("alerts", [])

        print(f"\n{'='*60}", flush=True)
        print(f"[{ts}]  status={status}  alerts={len(alerts)}", flush=True)

        for i, alert in enumerate(alerts, 1):
            labels = alert.get("labels", {})
            annotations = alert.get("annotations", {})
            print(f"  ── Alert {i} ──", flush=True)
            print(f"     alertname : {labels.get('alertname', 'n/a')}", flush=True)
            print(f"     severity  : {labels.get('severity', 'n/a')}", flush=True)
            print(f"     status    : {alert.get('status', 'n/a')}", flush=True)
            print(f"     summary   : {annotations.get('summary', 'n/a')}", flush=True)
            print(f"     description: {annotations.get('description', 'n/a')}", flush=True)
            print(f"     starts    : {alert.get('startsAt', 'n/a')}", flush=True)
            print(f"     ends      : {alert.get('endsAt', 'n/a')}", flush=True)

        print(f"{'='*60}\n", flush=True)

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def do_GET(self):
        """Health-check endpoint."""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"webhook-receiver is alive")

    # Silence per-request logs to keep output clean
    def log_message(self, format, *args):
        pass


def main():
    port = 5001
    server = HTTPServer(("0.0.0.0", port), WebhookHandler)
    print(f"Webhook receiver listening on :{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.", flush=True)
        sys.exit(0)


if __name__ == "__main__":
    main()
