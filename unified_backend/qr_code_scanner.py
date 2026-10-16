import cv2
import pyzbar.pyzbar as pyzbar
from encrypt_qr import decrypt_qr
from flask import Flask, request, jsonify, session, g, send_from_directory, send_file
import mysql.connector
import json
from encrypt_qr import decrypt_cart_id

import os
from dotenv import load_dotenv

load_dotenv()

def get_db():
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'sourjya@1614'),
            database=os.getenv('DB_NAME', 'drug_inventory_new')
        )
    return g.db


def get_encryption_key(cart_id):
    connection = None
    cursor = None
    try:
        connection = get_db()
        if not connection.is_connected():
            print("Error: Database connection failed")
            return None

        cursor = connection.cursor()
        query = "SELECT encryption_key FROM encryption_keys WHERE cart_id = %s"
        cursor.execute(query, (cart_id,))
        result = cursor.fetchone()

        return result[0] if result else None

    except Exception as e:
        print(f"Error: Failed to retrieve encryption key: {str(e)}")
        return None
    finally:
        if cursor:
            cursor.close()


def process_qr_data_string(qr_data):
    try:
        qr_data_json = json.loads(qr_data)
        print(f"Parsed QR Data (JSON): {qr_data_json}")

        # Decrypt cart_id first
        cart_id_dict = decrypt_cart_id(qr_data_json)
        if not cart_id_dict or "cart_id" not in cart_id_dict:
            print("Error: Failed to decrypt cart_id")
            return None

        cart_id = cart_id_dict["cart_id"]
        if not cart_id:
            print("Error: Decrypted cart_id is empty")
            return None

        # Get encryption key
        encryption_key = get_encryption_key(cart_id)
        if not encryption_key:
            print(f"Error: No encryption key found for cart_id: {cart_id}")
            return None

        # Decrypt full data
        final_decrypted_data = decrypt_qr(cart_id, qr_data, encryption_key)
        return final_decrypted_data

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in QR data: {str(e)}")
        return None
    except Exception as e:
        print(f"Error processing QR code string: {str(e)}")
        return None


import time

def scan_qr_codes(url, max_frames=120, timeout_sec=8.0):
    cap = None
    try:
        # If url is a digit string, cast to int for camera index; otherwise use as stream URL (e.g., http://.../video)
        target = url
        if isinstance(url, str) and url.strip().isdigit():
            target = int(url.strip())

        cap = cv2.VideoCapture(target)
        if not cap.isOpened():
            print(f"Error: Could not open video stream from {target}")
            return None

        start_time = time.time()
        frames_read = 0

        while frames_read < max_frames and (time.time() - start_time) < timeout_sec:
            ret, frame = cap.read()
            frames_read += 1
            if not ret or frame is None:
                time.sleep(0.04)
                continue

            # Try full-resolution first (better for high-density consignment QRs)
            qr_codes = pyzbar.decode(frame)
            if not qr_codes:
                resized = cv2.resize(frame, (0, 0), fx=0.50, fy=0.50)
                qr_codes = pyzbar.decode(resized)

            for qr_code in qr_codes:
                try:
                    qr_data = qr_code.data.decode("utf-8")
                    qr_type = qr_code.type

                    if qr_type == "QRCODE":
                        res = process_qr_data_string(qr_data)
                        if res is not None:
                            return res
                except Exception as ex:
                    print(f"Error parsing QR item: {ex}")
                    continue

        return None
    except Exception as e:
        print(f"Exception in scan_qr_codes({url}): {e}")
        return None
    finally:
        if cap:
            try:
                cap.release()
            except Exception:
                pass
