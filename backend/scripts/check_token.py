#!/usr/bin/env python3
"""
Check JWT token contents to debug auth issues
"""
import jwt
import sys
from dotenv import load_dotenv
import os

load_dotenv('/app/backend/.env')

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

def decode_token(token):
    """Decode and display JWT token contents"""
    try:
        # Remove Bearer prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        
        print("=" * 60)
        print("JWT TOKEN CONTENTS")
        print("=" * 60)
        print(f"\nUser ID: {payload.get('user_id', 'N/A')}")
        print(f"Email: {payload.get('email', 'N/A')}")
        print(f"Role: {payload.get('role', 'N/A')}")
        print(f"Expiry: {payload.get('exp', 'N/A')}")
        print("\nFull payload:")
        for key, value in payload.items():
            print(f"  {key}: {value}")
        print("=" * 60)
        
        return payload
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired!")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_token.py <jwt_token>")
        print("\nExample:")
        print("  python check_token.py eyJ0eXAiOiJKV1QiLCJhbGci...")
        sys.exit(1)
    
    token = sys.argv[1]
    decode_token(token)
