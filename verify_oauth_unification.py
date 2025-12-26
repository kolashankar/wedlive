#!/usr/bin/env python3
"""
Verification script for Google OAuth Unification
Checks that all services are using the correct unified credentials
"""
import os
import sys

# Add backend to path
sys.path.insert(0, '/app/backend')

def test_env_variables():
    """Test that environment variables are correctly set"""
    print("=" * 60)
    print("Testing Environment Variables")
    print("=" * 60)
    
    # Load .env
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    
    # Check required variables
    required_vars = {
        'GOOGLE_CLIENT_ID': '932956868834-0uu34koperj1og3dggevkb4toh96pg1d.apps.googleusercontent.com',
        'GOOGLE_CLIENT_SECRET': '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',
        'GOOGLE_YOUTUBE_REDIRECT_URI': 'https://wedlive.vercel.app/youtube/callback',
        'YOUTUBE_API_KEY': 'AIzaSyC-d_V54EUsJ6pbvm0juxxTa3gfbPmRcJA'
    }
    
    all_good = True
    for var, expected in required_vars.items():
        actual = os.getenv(var, '')
        if actual == expected:
            print(f"✅ {var}: CORRECT")
        else:
            print(f"❌ {var}: INCORRECT")
            print(f"   Expected: {expected}")
            print(f"   Got: {actual}")
            all_good = False
    
    # Check old variables are removed
    old_vars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_YOUTUBE_REDIRECT_URI']
    for var in old_vars:
        if os.getenv(var):
            print(f"⚠️  {var}: Still exists (should be removed)")
            all_good = False
        else:
            print(f"✅ {var}: Correctly removed")
    
    print()
    return all_good

def test_youtube_service():
    """Test that YouTube service loads correctly with unified credentials"""
    print("=" * 60)
    print("Testing YouTube Service")
    print("=" * 60)
    
    try:
        from app.services.youtube_service import YouTubeService
        
        youtube = YouTubeService()
        
        # Check credentials
        if youtube.client_id == '932956868834-0uu34koperj1og3dggevkb4toh96pg1d.apps.googleusercontent.com':
            print("✅ YouTube Service: Using correct GOOGLE_CLIENT_ID")
        else:
            print(f"❌ YouTube Service: Incorrect client_id: {youtube.client_id}")
            return False
        
        if youtube.redirect_uri == 'https://wedlive.vercel.app/youtube/callback':
            print("✅ YouTube Service: Using correct GOOGLE_YOUTUBE_REDIRECT_URI")
        else:
            print(f"❌ YouTube Service: Incorrect redirect_uri: {youtube.redirect_uri}")
            return False
        
        if youtube.api_key.startswith('AIzaSyC'):
            print("✅ YouTube Service: API key loaded correctly")
        else:
            print(f"❌ YouTube Service: Incorrect API key: {youtube.api_key}")
            return False
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ Error loading YouTube Service: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_google_auth_service():
    """Test that Google Auth service loads correctly"""
    print("=" * 60)
    print("Testing Google Auth Service")
    print("=" * 60)
    
    try:
        from app.services.google_auth_service import GoogleAuthService
        
        google_auth = GoogleAuthService()
        
        # Check credentials
        if google_auth.client_id == '932956868834-0uu34koperj1og3dggevkb4toh96pg1d.apps.googleusercontent.com':
            print("✅ Google Auth Service: Using correct GOOGLE_CLIENT_ID")
        else:
            print(f"❌ Google Auth Service: Incorrect client_id: {google_auth.client_id}")
            return False
        
        if 'auth/google/callback' in google_auth.redirect_uri:
            print("✅ Google Auth Service: Using correct GOOGLE_AUTH_REDIRECT_URI")
        else:
            print(f"❌ Google Auth Service: Incorrect redirect_uri: {google_auth.redirect_uri}")
            return False
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ Error loading Google Auth Service: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n🔍 Google OAuth Unification Verification\n")
    
    results = []
    
    # Test environment variables
    results.append(("Environment Variables", test_env_variables()))
    
    # Test YouTube service
    results.append(("YouTube Service", test_youtube_service()))
    
    # Test Google Auth service
    results.append(("Google Auth Service", test_google_auth_service()))
    
    # Summary
    print("=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 All tests passed! OAuth unification is complete.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
