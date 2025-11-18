#!/usr/bin/env python
"""End-to-end test of Champollion backend with real MP3 file."""
import asyncio
import time
from pathlib import Path

import httpx

BASE_URL = "http://localhost:8000"
MP3_FILE = Path(__file__).parent.parent / "mp3" / "Etienne Klein - Cours introductif de Philosophie des Sciences 1_9.mp3"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"
MISTRAL_API_KEY = "qkoRhC9TtH3VFzinrr1tU8hVvY625WQX"


async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=300.0) as client:
        print("=" * 80)
        print("Champollion E2E Test")
        print("=" * 80)

        # 1. Register
        print("\n1. Registering user...")
        register_resp = await client.post("/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if register_resp.status_code == 201:
            print(f"   ✓ User registered: {TEST_EMAIL}")
        elif register_resp.status_code == 400 and "REGISTER_USER_ALREADY_EXISTS" in register_resp.text:
            print(f"   ℹ User already exists, continuing...")
        else:
            print(f"   ✗ Registration failed: {register_resp.status_code} {register_resp.text}")
            return

        # 2. Login
        print("\n2. Logging in...")
        login_resp = await client.post("/auth/jwt/login", data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_resp.status_code != 200:
            print(f"   ✗ Login failed: {login_resp.status_code} {login_resp.text}")
            return

        token_data = login_resp.json()
        access_token = token_data["access_token"]
        print(f"   ✓ Logged in, got token")

        # Set authorization header for subsequent requests
        client.headers["Authorization"] = f"Bearer {access_token}"

        # 3. Update user API key
        print("\n3. Setting Mistral API key...")
        me_resp = await client.get("/auth/users/me")
        user_id = me_resp.json()["id"]

        update_resp = await client.patch("/auth/users/me", json={
            "api_key": MISTRAL_API_KEY
        })
        if update_resp.status_code != 200:
            print(f"   ✗ Failed to update API key: {update_resp.status_code} {update_resp.text}")
            return
        print(f"   ✓ API key stored (encrypted)")

        # 4. Create course
        print("\n4. Creating course...")
        course_resp = await client.post("/courses", json={
            "title": "Philosophie des Sciences - Etienne Klein",
            "description": "Cours introductif 1/9"
        })
        if course_resp.status_code != 201:
            print(f"   ✗ Course creation failed: {course_resp.status_code} {course_resp.text}")
            return

        course = course_resp.json()
        course_id = course["id"]
        print(f"   ✓ Course created with ID: {course_id}")

        # 5. Upload audio file
        print(f"\n5. Uploading audio file ({MP3_FILE.name})...")
        if not MP3_FILE.exists():
            print(f"   ✗ File not found: {MP3_FILE}")
            return

        file_size_mb = MP3_FILE.stat().st_size / (1024 * 1024)
        print(f"   File size: {file_size_mb:.1f} MB")

        with MP3_FILE.open("rb") as f:
            upload_resp = await client.post(
                f"/courses/{course_id}/recordings",
                files={"file": (MP3_FILE.name, f, "audio/mpeg")}
            )

        if upload_resp.status_code != 201:
            print(f"   ✗ Upload failed: {upload_resp.status_code} {upload_resp.text}")
            return

        recording = upload_resp.json()
        print(f"   ✓ Audio uploaded, duration: {recording['duration_seconds']}s")

        # 6. Start transcription
        print("\n6. Starting transcription...")
        transcribe_resp = await client.post(
            f"/courses/{course_id}/transcriptions",
            json={"provider": "mistral"}
        )
        if transcribe_resp.status_code != 202:
            print(f"   ✗ Transcription start failed: {transcribe_resp.status_code} {transcribe_resp.text}")
            return

        job = transcribe_resp.json()
        print(f"   ✓ Transcription job started: {job['status']}")

        # 7. Poll for transcription completion
        print("\n7. Waiting for transcription to complete...")
        max_wait = 600  # 10 minutes
        start_time = time.time()

        while time.time() - start_time < max_wait:
            status_resp = await client.get(f"/courses/{course_id}/transcriptions/status")
            job_status = status_resp.json()
            status = job_status["status"]

            print(f"   Status: {status}")

            if status == "completed":
                print(f"   ✓ Transcription completed!")
                break
            elif status == "failed":
                print(f"   ✗ Transcription failed: {job_status.get('error_message')}")
                return

            await asyncio.sleep(5)
        else:
            print(f"   ✗ Transcription timed out after {max_wait}s")
            return

        # 8. Generate document
        print("\n8. Generating document...")
        document_resp = await client.post(
            f"/courses/{course_id}/documents",
            json={"provider": "mistral"}
        )
        if document_resp.status_code != 202:
            print(f"   ✗ Document generation failed: {document_resp.status_code} {document_resp.text}")
            return

        print(f"   ✓ Document generation job started")

        # 9. Wait for document
        print("\n9. Waiting for document to be generated...")
        start_time = time.time()

        while time.time() - start_time < max_wait:
            try:
                document_get_resp = await client.get(f"/courses/{course_id}/documents")
                if document_get_resp.status_code == 200:
                    document_data = document_get_resp.json()
                    markdown = document_data["markdown"]
                    print(f"   ✓ Document generated! ({len(markdown)} characters)")
                    print(f"\n   Preview (first 500 chars):")
                    print(f"   {markdown[:500]}...")
                    break
            except Exception:
                pass

            await asyncio.sleep(5)
        else:
            print(f"   ✗ Document generation timed out")
            return

        # 10. Get final course detail
        print("\n10. Final course details...")
        detail_resp = await client.get(f"/courses/{course_id}")
        course_detail = detail_resp.json()

        print(f"   Course ID: {course_detail['id']}")
        print(f"   Title: {course_detail['title']}")
        print(f"   Status: {course_detail['status']}")
        print(f"   Has sources: {len(course_detail.get('sources', []))} > 0")
        print(f"   Has transcript: {course_detail.get('transcript') is not None}")
        print(f"   Has document: {course_detail.get('document') is not None}")

        print("\n" + "=" * 80)
        print("✓ E2E TEST COMPLETED SUCCESSFULLY!")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
