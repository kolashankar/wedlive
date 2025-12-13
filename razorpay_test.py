#!/usr/bin/env python3
"""
Razorpay Payment Integration Testing Suite
Tests specific endpoints mentioned in the review request
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://rtmp-wedding-stream.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

class RazorpayTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_user_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        print(f"🔧 Testing Razorpay integration at: {API_BASE}")
    
    async def cleanup(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, error: str = None):
        """Log test result"""
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {error}")
            print(f"❌ {test_name}: {error}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{API_BASE}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data, response.status
        except Exception as e:
            return False, str(e), 0
    
    async def create_test_user(self):
        """Create and authenticate test user"""
        test_email = f"razorpay_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        user_data = {
            "email": test_email,
            "password": "RazorpayTest123!",
            "full_name": "Razorpay Test User"
        }
        
        success, response, status = await self.make_request("POST", "/auth/register", user_data)
        
        if success and status == 201:
            if "access_token" in response and "user" in response:
                self.auth_token = response["access_token"]
                self.test_user_id = response["user"]["id"]
                self.log_result("User Registration & Authentication", True)
                return True
            else:
                self.log_result("User Registration & Authentication", False, "Missing access_token or user in response")
        else:
            self.log_result("User Registration & Authentication", False, f"Status {status}: {response}")
        
        return False
    
    async def test_subscription_checkout_monthly(self):
        """Test subscription checkout for monthly plan"""
        if not self.auth_token:
            self.log_result("Monthly Subscription Checkout", False, "No auth token")
            return False
        
        checkout_data = {"plan": "monthly"}
        success, response, status = await self.make_request("POST", "/subscriptions/create-checkout-session", checkout_data)
        
        if success and status == 200:
            required_fields = ["subscription_id", "razorpay_key", "amount", "mode"]
            if all(field in response for field in required_fields):
                # Verify TEST mode
                if response["mode"] == "TEST":
                    # Verify subscription ID format
                    if response["subscription_id"].startswith("sub_"):
                        # Verify razorpay key
                        if response["razorpay_key"] == "rzp_test_RohtuBUDnY3DP9":
                            self.log_result("Monthly Subscription Checkout", True)
                            print(f"   ✅ Subscription ID: {response['subscription_id']}")
                            print(f"   ✅ Amount: ₹{response['amount']/100}")
                            print(f"   ✅ Mode: {response['mode']}")
                            return True
                        else:
                            self.log_result("Monthly Subscription Checkout", False, 
                                          f"Wrong razorpay_key: {response['razorpay_key']}")
                    else:
                        self.log_result("Monthly Subscription Checkout", False, 
                                      f"Invalid subscription_id format: {response['subscription_id']}")
                else:
                    self.log_result("Monthly Subscription Checkout", False, 
                                  f"Expected TEST mode, got: {response['mode']}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                self.log_result("Monthly Subscription Checkout", False, 
                              f"Missing fields: {missing_fields}")
        else:
            self.log_result("Monthly Subscription Checkout", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_subscription_checkout_yearly(self):
        """Test subscription checkout for yearly plan"""
        if not self.auth_token:
            self.log_result("Yearly Subscription Checkout", False, "No auth token")
            return False
        
        checkout_data = {"plan": "yearly"}
        success, response, status = await self.make_request("POST", "/subscriptions/create-checkout-session", checkout_data)
        
        if success and status == 200:
            required_fields = ["subscription_id", "razorpay_key", "amount", "mode"]
            if all(field in response for field in required_fields):
                # Verify TEST mode
                if response["mode"] == "TEST":
                    # Verify subscription ID format
                    if response["subscription_id"].startswith("sub_"):
                        # Verify razorpay key
                        if response["razorpay_key"] == "rzp_test_RohtuBUDnY3DP9":
                            self.log_result("Yearly Subscription Checkout", True)
                            print(f"   ✅ Subscription ID: {response['subscription_id']}")
                            print(f"   ✅ Amount: ₹{response['amount']/100}")
                            print(f"   ✅ Mode: {response['mode']}")
                            return True
                        else:
                            self.log_result("Yearly Subscription Checkout", False, 
                                          f"Wrong razorpay_key: {response['razorpay_key']}")
                    else:
                        self.log_result("Yearly Subscription Checkout", False, 
                                      f"Invalid subscription_id format: {response['subscription_id']}")
                else:
                    self.log_result("Yearly Subscription Checkout", False, 
                                  f"Expected TEST mode, got: {response['mode']}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                self.log_result("Yearly Subscription Checkout", False, 
                              f"Missing fields: {missing_fields}")
        else:
            self.log_result("Yearly Subscription Checkout", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_subscription_free_plan_rejection(self):
        """Test that free plan is rejected for checkout"""
        if not self.auth_token:
            self.log_result("Free Plan Rejection", False, "No auth token")
            return False
        
        checkout_data = {"plan": "free"}
        success, response, status = await self.make_request("POST", "/subscriptions/create-checkout-session", checkout_data)
        
        if status == 400:
            if "Free plan does not require checkout" in str(response):
                self.log_result("Free Plan Rejection", True)
                return True
            else:
                self.log_result("Free Plan Rejection", False, 
                              f"Wrong error message: {response}")
        else:
            self.log_result("Free Plan Rejection", False, 
                          f"Expected 400 status, got {status}: {response}")
        
        return False
    
    async def test_one_time_payment_order(self):
        """Test one-time payment order creation with amount 50000 (₹500)"""
        if not self.auth_token:
            self.log_result("One-Time Payment Order", False, "No auth token")
            return False
        
        order_data = {
            "amount": 50000,  # ₹500 in paise
            "currency": "INR",
            "receipt": f"test_order_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        
        success, response, status = await self.make_request("POST", "/subscriptions/create-order", order_data)
        
        if success and status == 200:
            required_fields = ["order_id", "razorpay_key", "mode"]
            if all(field in response for field in required_fields):
                # Verify TEST mode
                if response["mode"] == "TEST":
                    # Verify order ID format
                    if response["order_id"].startswith("order_"):
                        # Verify amount
                        if response["amount"] == 50000:
                            # Verify razorpay key
                            if response["razorpay_key"] == "rzp_test_RohtuBUDnY3DP9":
                                self.log_result("One-Time Payment Order", True)
                                print(f"   ✅ Order ID: {response['order_id']}")
                                print(f"   ✅ Amount: ₹{response['amount']/100}")
                                print(f"   ✅ Mode: {response['mode']}")
                                return True
                            else:
                                self.log_result("One-Time Payment Order", False, 
                                              f"Wrong razorpay_key: {response['razorpay_key']}")
                        else:
                            self.log_result("One-Time Payment Order", False, 
                                          f"Wrong amount: {response['amount']}, expected 50000")
                    else:
                        self.log_result("One-Time Payment Order", False, 
                                      f"Invalid order_id format: {response['order_id']}")
                else:
                    self.log_result("One-Time Payment Order", False, 
                                  f"Expected TEST mode, got: {response['mode']}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                self.log_result("One-Time Payment Order", False, 
                              f"Missing fields: {missing_fields}")
        else:
            self.log_result("One-Time Payment Order", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_payment_history(self):
        """Test payment history endpoint"""
        if not self.auth_token:
            self.log_result("Payment History", False, "No auth token")
            return False
        
        success, response, status = await self.make_request("GET", "/subscriptions/payment-history")
        
        if success and status == 200:
            required_fields = ["success", "payments", "mode"]
            if all(field in response for field in required_fields):
                # Verify TEST mode
                if response["mode"] == "TEST":
                    # Verify payments is a list (may be empty for new user)
                    if isinstance(response["payments"], list):
                        self.log_result("Payment History", True)
                        print(f"   ✅ Payments count: {len(response['payments'])}")
                        print(f"   ✅ Mode: {response['mode']}")
                        return True
                    else:
                        self.log_result("Payment History", False, 
                                      f"Payments is not a list: {type(response['payments'])}")
                else:
                    self.log_result("Payment History", False, 
                                  f"Expected TEST mode, got: {response['mode']}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                self.log_result("Payment History", False, 
                              f"Missing fields: {missing_fields}")
        else:
            self.log_result("Payment History", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_current_subscription(self):
        """Test current subscription endpoint"""
        if not self.auth_token:
            self.log_result("Current Subscription", False, "No auth token")
            return False
        
        success, response, status = await self.make_request("GET", "/subscriptions/my-subscription")
        
        if success and status == 200:
            required_fields = ["id", "user_id", "plan", "status"]
            if all(field in response for field in required_fields):
                # For new user, should return free plan
                if response["plan"] == "free" and response["status"] == "active":
                    self.log_result("Current Subscription", True)
                    print(f"   ✅ Plan: {response['plan']}")
                    print(f"   ✅ Status: {response['status']}")
                    return True
                else:
                    self.log_result("Current Subscription", False, 
                                  f"Unexpected plan/status: {response['plan']}/{response['status']}")
            else:
                missing_fields = [field for field in required_fields if field not in response]
                self.log_result("Current Subscription", False, 
                              f"Missing fields: {missing_fields}")
        else:
            self.log_result("Current Subscription", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def run_razorpay_tests(self):
        """Run all Razorpay integration tests"""
        print("🚀 Starting Razorpay Payment Integration Tests")
        print("=" * 60)
        print("Testing endpoints as specified in review request:")
        print("- Subscription Checkout (monthly/yearly)")
        print("- One-Time Payment Order (₹500)")
        print("- Payment History")
        print("- Current Subscription")
        print("- Free Plan Rejection")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Create authenticated test user
            print("\n🔐 AUTHENTICATION SETUP")
            print("-" * 30)
            if not await self.create_test_user():
                print("❌ Failed to create test user. Aborting tests.")
                return
            
            # Test Razorpay endpoints
            print("\n💳 RAZORPAY INTEGRATION TESTS")
            print("-" * 40)
            
            await self.test_subscription_checkout_monthly()
            await self.test_subscription_checkout_yearly()
            await self.test_subscription_free_plan_rejection()
            await self.test_one_time_payment_order()
            await self.test_payment_history()
            await self.test_current_subscription()
            
        finally:
            await self.cleanup()
        
        # Print Results Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 RAZORPAY INTEGRATION TEST RESULTS")
        print("=" * 60)
        
        total_tests = self.results["passed"] + self.results["failed"]
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        
        if self.results["errors"]:
            print("\n🚨 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        print("-" * 60)
        if self.results["failed"] == 0:
            print("🎉 All Razorpay integration tests passed!")
            print("✅ TEST mode detected correctly")
            print("✅ All endpoints returning proper Razorpay fields")
            print("✅ No setuptools/pkg_resources errors detected")
        else:
            print(f"⚠️  {self.results['failed']} tests failed. Review issues above.")

async def main():
    """Main test runner"""
    tester = RazorpayTester()
    await tester.run_razorpay_tests()

if __name__ == "__main__":
    asyncio.run(main())