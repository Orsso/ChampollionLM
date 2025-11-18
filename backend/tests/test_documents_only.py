#!/usr/bin/env python
"""Test document generation only."""
import asyncio
import time
import httpx

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=300.0) as client:
        print("\n=== Testing Document Generation ===\n")

        # Login
        login_resp = await client.post("/auth/jwt/login", data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token_data = login_resp.json()
        access_token = token_data["access_token"]
        client.headers["Authorization"] = f"Bearer {access_token}"

        # Check course exists
        course_resp = await client.get("/courses/1")
        course = course_resp.json()
        print(f"Course: {course['title']}")
        print(f"Status: {course['status']}")
        print(f"Has transcript: {course['transcript'] is not None}")

        # Generate document
        print("\nStarting document generation...")
        document_resp = await client.post("/courses/1/documents", json={"provider": "mistral"})
        if document_resp.status_code != 202:
            print(f"ERROR: {document_resp.status_code} {document_resp.text}")
            return

        print("Document generation job started, waiting...")

        # Poll for document
        max_wait = 180  # 3 minutes
        start_time = time.time()

        while time.time() - start_time < max_wait:
            try:
                document_get_resp = await client.get("/courses/1/documents")
                if document_get_resp.status_code == 200:
                    document_data = document_get_resp.json()
                    markdown = document_data["markdown"]
                    print(f"\n✓ Document generated! ({len(markdown)} characters)")
                    print(f"\n=== Preview ===")
                    print(markdown[:1000])
                    print("...")
                    return
            except Exception as e:
                print(f"Still waiting... ({int(time.time() - start_time)}s)")

            await asyncio.sleep(5)

        print("Timeout waiting for document")


if __name__ == "__main__":
    asyncio.run(main())
