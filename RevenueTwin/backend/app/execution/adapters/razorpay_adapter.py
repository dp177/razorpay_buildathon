import os
import time
import razorpay
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class RazorpayAdapter:
    def __init__(self):
        self.key_id = os.getenv("RZP_TEST_KEY", "rzp_test_TVFY3uRhKlnFE6")
        self.key_secret = os.getenv("RZP_TEST_SECRET", "zWJDNC4jfG30jFjtXqcbW77d")
        # Ensure we don't crash if keys are missing in some envs
        if self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        else:
            self.client = None

    async def generate_payment_link(
        self,
        amount_in_rupees: float,
        reference_id: str,
        description: str = "Payment Recovery",
        customer_name: str = "Demo Customer",
        customer_email: str = "customer@example.com",
        customer_contact: str = "+919876543210"
    ) -> Optional[str]:
        """
        Calls Razorpay API to generate a real payment link.
        Returns the short_url of the generated link.
        """
        if not self.client:
            print("[RazorpayAdapter] Missing keys, skipping real API call.")
            return None
            
        try:
            # Razorpay expects amount in paise
            amount_in_paise = int(amount_in_rupees * 100)
            
            # Razorpay reference_id max length is 40 characters
            clean_ref = str(reference_id).replace("-", "")[:16]
            ref_id = f"rec_{clean_ref}_{int(time.time())}"
            
            # Payment Link payload
            payload = {
                "amount": amount_in_paise,
                "currency": "INR",
                "accept_partial": False,
                "first_min_partial_amount": 0,
                "reference_id": ref_id,
                "description": description,
                "customer": {
                    "name": customer_name or "Demo Customer",
                    "email": customer_email or "customer@example.com",
                    "contact": customer_contact or "+919876543210"
                },
                "notify": {
                    "sms": False,
                    "email": False
                },
                "reminder_enable": True
            }
            
            # Blocking call in async function
            response = self.client.payment_link.create(payload)
            short_url = response.get("short_url")
            print(f"[RazorpayAdapter] Real payment link generated successfully: {short_url}")
            return short_url
            
        except Exception as e:
            print(f"[RazorpayAdapter] Failed to generate payment link: {e}")
            return None

razorpay_adapter = RazorpayAdapter()
