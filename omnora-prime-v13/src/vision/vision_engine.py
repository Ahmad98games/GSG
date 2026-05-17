# src/vision/vision_engine.py
import cv2
import numpy as np
import time
import os
import json
import requests
import hmac
import hashlib
import threading
from collections import deque
from supabase import create_client, Client
from flask import Flask, Response

# Config
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
INTERNAL_SECRET = os.environ.get("SENTINEL_INTERNAL_SECRET", "noxis_secure_sentinel_bridge_2026")
HUB_API_URL = "http://localhost:3000/api/sentinel"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class CameraProcessor:
    def __init__(self, node_id, preroll_seconds=10, fps=15):
        self.node_id = node_id
        self.fps = fps
        self.preroll_frames = preroll_seconds * fps
        self.frame_buffer = deque(maxlen=self.preroll_frames)
        
        self.config = self.fetch_config()
        self.rtsp_url = self.config.get('rtsp_url', 0) # 0 for webcam fallback
        
        self.is_recording = False
        self.video_writer = None
        self.current_recording_id = None
        self.recording_timeout = 0
        
        self.frame_width = 1280
        self.frame_height = 720
        self.mode = 'WATCH' # WATCH or EVIDENCE
        
        self.zones = self.config.get('detection_zones', [])
        self.ai_enabled = self.config.get('ai_enabled', False)
        self.last_detection_time = {}

    def fetch_config(self):
        res = supabase.table("cctv_nodes").select("*").eq("id", self.node_id).single().execute()
        return res.data if res.data else {}

    def is_point_in_polygon(self, point, polygon):
        x, y = point
        n = len(polygon)
        inside = False
        if n == 0: return False
        p1x, p1y = polygon[0]['x'], polygon[0]['y']
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]['x'], polygon[i % n]['y']
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xints:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def process_frame(self, frame, detections):
        self.frame_buffer.append(frame.copy())
        
        if not self.ai_enabled:
            return

        human_detected = False
        for det in detections:
            bbox = det['bbox']
            center = (bbox[0] + bbox[2]/2, bbox[1] + bbox[3]/2)
            
            active_zone_id = None
            for zone in self.zones:
                if self.is_point_in_polygon(center, zone['points']):
                    active_zone_id = zone['id']
                    break

            if det['class'] == 'person':
                human_detected = True
                self.on_human_detected(frame, det, active_zone_id)

        if not human_detected and self.is_recording:
            if time.time() > self.recording_timeout:
                self.stop_recording()
            else:
                if self.video_writer:
                    self.video_writer.write(frame)

    def on_human_detected(self, frame, det, zone_id):
        # Cooldown check for Supabase logging
        det_key = f"{det['class']}_{zone_id}"
        if time.time() - self.last_detection_time.get(det_key, 0) > 10:
            self.log_event(det, zone_id)
            self.last_detection_time[det_key] = time.time()

        # Trigger Recording
        if not self.is_recording:
            self.start_recording_with_preroll()
        else:
            self.extend_recording_timeout()
        
        if self.video_writer:
            self.video_writer.write(frame)

    def log_event(self, det, zone_id):
        event_data = {
            "business_id": self.config['business_id'],
            "node_id": self.node_id,
            "detected_class": det['class'],
            "confidence": det['score'],
            "zone_id": zone_id,
            "bbox_x": det['bbox'][0],
            "bbox_y": det['bbox'][1],
            "bbox_w": det['bbox'][2],
            "bbox_h": det['bbox'][3]
        }
        supabase.table("ai_detection_events").insert(event_data).execute()

    def start_recording_with_preroll(self):
        timestamp = int(time.time())
        filename = f"recording_{self.node_id}_{timestamp}.mp4"
        filepath = os.path.abspath(f"./recordings/{filename}")
        os.makedirs("./recordings", exist_ok=True)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.video_writer = cv2.VideoWriter(filepath, fourcc, self.fps, (self.frame_width, self.frame_height))
        
        # Write Pre-roll
        for buf_frame in list(self.frame_buffer):
            self.video_writer.write(buf_frame)
            
        self.is_recording = True
        self.recording_timeout = time.time() + 30
        
        # Notify Hub
        try:
            res = requests.post(f"{HUB_API_URL}/recording-started", 
                headers={'x-sentinel-secret': INTERNAL_SECRET},
                json={'camera_id': self.node_id, 'filepath': filepath, 'timestamp': timestamp}
            )
            self.current_recording_id = res.json().get('recording_id')
        except Exception as e:
            print(f"Hub notification failed: {e}")

    def extend_recording_timeout(self):
        self.recording_timeout = time.time() + 30

    def stop_recording(self):
        if not self.is_recording: return
        
        filepath = None
        if self.video_writer:
            # Get path before releasing (simulated)
            self.video_writer.release()
            self.video_writer = None
        
        self.is_recording = False
        
        # Sign footage
        # We need to find the file we just closed. 
        # In this simplified version, we'll assume we know the path.
        # Implementation of sign_recording...
        
        print(f"Recording stopped for node {self.node_id}")
        # Notify Hub completion
        try:
            requests.post(f"{HUB_API_URL}/recording-complete",
                headers={'x-sentinel-secret': INTERNAL_SECRET},
                json={'camera_id': self.node_id, 'recording_id': self.current_recording_id}
            )
        except: pass

    def sign_recording(self, filepath):
        with open(filepath, 'rb') as f:
            file_bytes = f.read()
        signature = hmac.new(INTERNAL_SECRET.encode(), file_bytes, hashlib.sha256).hexdigest()
        with open(filepath + '.sig', 'w') as f:
            f.write(signature)
        return signature

app = Flask(__name__)
processors = {}

@app.route('/stream/<id>')
def stream(id):
    if id not in processors:
        processors[id] = CameraProcessor(id)
        
    def generate():
        proc = processors[id]
        cap = cv2.VideoCapture(proc.rtsp_url)
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            # Simulated Detection (In production, run real model)
            # proc.process_frame(frame, []) 
            
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    import sys
    node_id = sys.argv[1] if len(sys.argv) > 1 else None
    if node_id:
        app.run(host='0.0.0.0', port=5001)
    else:
        print("Usage: python vision_engine.py <node_id>")
