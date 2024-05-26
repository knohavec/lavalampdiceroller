import cv2
import numpy as np
import random

def generate_random_number_from_frame():
    for camera_index in range(5):
        cap = cv2.VideoCapture(camera_index)
        if cap.isOpened():
            print(f"Camera opened successfully with index {camera_index}")
            break
        else:
            print(f"Error: Could not open webcam with index {camera_index}")
    
    if not cap.isOpened():
        print("Error: Could not open any webcam.")
        return
    
    ret, frame = cap.read()
    
    if not ret:
        print("Error: Could not read frame.")
        return
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    small_frame = cv2.resize(gray, (100, 100))
    flattened = small_frame.flatten()
    random_seed = int(np.sum(flattened) % (2**32))
    
    random.seed(random_seed)
    random_number = random.randint(0, 1000000)
    
    print(f"Generated seed: {random_seed}")  # Added logging
    return random_seed

if __name__ == "__main__":
    seed = generate_random_number_from_frame()
    if seed is not None:
        print(seed)
