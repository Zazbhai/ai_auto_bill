import cv2
import os
import sys
import time
import requests
import json
import signal
from ultralytics import YOLO
from requests.structures import CaseInsensitiveDict

# YOLO Model Path
model_path = "best.pt"

# Labels with fixed product IDs
labels = {
    "5Star": 1,
    "Dairy Milk": 2,
    "Hide n Seek": 3,
    "Kurkure": 4,
    "Lays": 5,
    "Nimbooz": 6,
    "Pepsi": 7,
    "Smoodh": 8,
    "Tropicana": 9
}

# Prices for each product
prices = {
    "5Star": 10,
    "Dairy Milk": 20,
    "Hide n Seek": 30,
    "Kurkure": 20,
    "Lays": 20,
    "Nimbooz": 20,
    "Pepsi": 20,
    "Smoodh": 10,
    "Tropicana": 20
}

# Product tracking dictionary
product_counts = {label: 0 for label in labels}

# Frame rate control
FPS = 2  # Limit to 2 detections per second
DELAY = 1 / FPS  # Time delay between frames

def sigint_handler(sig, frame):
    print('Interrupted')
    sys.exit(0)

signal.signal(signal.SIGINT, sigint_handler)

def post(label, taken):
    url = "http://localhost:3000/product"
    headers = CaseInsensitiveDict()
    headers["Content-Type"] = "application/json"
    
    product_id = labels[label]  # Get the fixed ID
    price = prices[label]  # Get the price
    payable = price * taken  # Calculate total price
    
    data_dict = {
        "id": product_id,
        "name": label,
        "price": price,
        "units": "units",
        "taken": taken,
        "payable": payable
    }
    
    data = json.dumps(data_dict)
    resp = requests.post(url, headers=headers, data=data)
    print(f"POST Response for {label}: {resp.status_code}")

def process_product(label):
    global product_counts
    product_counts[label] = 1 if product_counts[label] == 0 else product_counts[label]  # Just add, don't increment
    post(label, product_counts[label])  # Post updated count
    print(f"Detected: {label}, Total Taken: {product_counts[label]}")
    
    time.sleep(3)  # Sleep for 3 seconds after detection

def main():
    print("Loading YOLO model...")
    model = YOLO(model_path)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open video feed.")
        sys.exit(1)

    last_detection_time = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame.")
            break

       

     

        results = model(frame, conf=0.89)  # Set confidence threshold to 89%
        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                if cls < len(labels):
                    label = list(labels.keys())[cls]
                    process_product(label)

        cv2.imshow("YOLO Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
