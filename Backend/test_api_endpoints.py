#!/usr/bin/env python
"""
API ENDPOINT TESTING
Tests the test system API endpoints
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_login():
    """Test student login"""
    print("Testing student login...")
    
    login_data = {
        "email": "student@test.com",
        "password": "student123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/accounts/student/login/", json=login_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Access token: {data.get('access', 'N/A')[:20]}...")
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_assigned_tests(token):
    """Test getting assigned tests"""
    print("\nTesting assigned tests...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/tests/student/my-tests/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Assigned tests retrieved!")
            print(f"Total assignments: {data.get('total', 0)}")
            
            assignments = data.get('assignments', [])
            
            # If the only assignment is submitted, create a new one for testing
            if len(assignments) == 1 and assignments[0].get('status') == 'submitted':
                print("Creating new assignment for testing...")
                test_id = assignments[0].get('test')
                
                # Create retake
                retake_response = requests.post(f"{BASE_URL}/tests/student/retake/{test_id}/", 
                                              headers=headers, json={})
                if retake_response.status_code == 201:
                    print("✅ Created new assignment for testing")
                    # Get updated assignments
                    response = requests.get(f"{BASE_URL}/tests/student/my-tests/", headers=headers)
                    data = response.json()
                    assignments = data.get('assignments', [])
                else:
                    print(f"❌ Failed to create retake: {retake_response.text}")
            
            for assignment in assignments:
                print(f"  - {assignment.get('test_title', 'N/A')} (Status: {assignment.get('status', 'N/A')})")
            
            return assignments
        else:
            print(f"❌ Failed to get assigned tests: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error getting assigned tests: {e}")
        return []

def test_start_test(token, test_id):
    """Test starting a test"""
    print(f"\nTesting start test (ID: {test_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/tests/student/start/{test_id}/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Test started successfully!")
            print(f"Test title: {data.get('test', {}).get('title', 'N/A')}")
            print(f"Questions count: {len(data.get('questions', []))}")
            print(f"Assignment ID: {data.get('assignment_id', 'N/A')}")
            
            return data
        else:
            print(f"❌ Failed to start test: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error starting test: {e}")
        return None

def test_submit_test(token, test_id, test_data):
    """Test submitting a test"""
    print(f"\nTesting submit test (ID: {test_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Prepare answers (select first option for each question)
    answers = []
    questions = test_data.get('questions', [])
    
    for question in questions:
        options = question.get('options', [])
        if options:
            answers.append({
                "question_id": question.get('id'),
                "selected_option_id": options[0].get('id')
            })
    
    try:
        response = requests.post(f"{BASE_URL}/tests/student/submit/{test_id}/", 
                              headers=headers, json=answers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Test submitted successfully!")
            print(f"Message: {data.get('message', 'N/A')}")
            print(f"Obtained marks: {data.get('obtained_marks', 0)}")
            print(f"Total marks: {data.get('total_marks', 0)}")
            print(f"Percentage: {data.get('percentage', 0)}%")
            
            return data
        else:
            print(f"❌ Failed to submit test: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error submitting test: {e}")
        return None

def test_test_results(token, test_id):
    """Test getting test results"""
    print(f"\nTesting test results (ID: {test_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/tests/student/result/{test_id}/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Test results retrieved!")
            print(f"Test title: {data.get('test', {}).get('title', 'N/A')}")
            print(f"Status: {data.get('status', 'N/A')}")
            print(f"Obtained marks: {data.get('results', {}).get('obtained_marks', 0)}")
            print(f"Total marks: {data.get('results', {}).get('total_marks', 0)}")
            print(f"Percentage: {data.get('results', {}).get('percentage', 0)}%")
            
            return data
        else:
            print(f"❌ Failed to get test results: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting test results: {e}")
        return None

def main():
    """Main test function"""
    print("="*60)
    print("TEST SYSTEM API ENDPOINT TESTING")
    print("="*60)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without valid token")
        return False
    
    # Test assigned tests
    assignments = test_assigned_tests(token)
    if not assignments:
        print("❌ No assigned tests found")
        return False
    
    # Get the first test
    first_assignment = assignments[0]
    test_id = first_assignment.get('test')
    
    print(f"Debug: First assignment data: {first_assignment}")
    print(f"Debug: Extracted test_id: {test_id}")
    
    if not test_id:
        print("❌ No test_id found in assignment")
        return False
    
    # Test start test
    test_data = test_start_test(token, test_id)
    if not test_data:
        print("❌ Failed to start test")
        return False
    
    # Test submit test
    submit_result = test_submit_test(token, test_id, test_data)
    if not submit_result:
        print("❌ Failed to submit test")
        return False
    
    # Test test results
    results = test_test_results(token, test_id)
    if not results:
        print("❌ Failed to get test results")
        return False
    
    print("\n" + "="*60)
    print("✅ ALL API TESTS PASSED!")
    print("The test system API endpoints are working correctly.")
    print("="*60)
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)
