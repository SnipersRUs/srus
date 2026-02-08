#!/usr/bin/env python3
"""Test Discord webhook for Short Hunter Bot"""

import requests
import sys

WEBHOOK_URL = "https://discord.com/api/webhooks/1444925694290300938/ACddvkCxvrMz6I_LqbH7l4TOyhicCMh67g-kAtal8YPi0F-AZbXnZpYe7vzrQihJKo5X"

def test_webhook():
    """Send a test message to Discord"""
    payload = {
        "username": "Short Hunter",
        "embeds": [{
            "title": "🧪 WEBHOOK TEST",
            "description": "If you see this, the webhook is working! ✅",
            "color": 0x00ff00,
            "fields": [
                {"name": "Status", "value": "Connected", "inline": True},
                {"name": "Action", "value": "Test ping", "inline": True}
            ],
            "footer": {"text": "Short Hunter Bot - Webhook Test"}
        }],
        "content": "🧪 **Webhook Test** - Ping successful!"
    }

    print("Sending test message to Discord...")
    try:
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in (200, 201, 204):
            print("✅ Webhook working! Check Discord.")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_webhook()
    sys.exit(0 if success else 1)
