from typing import Union
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime, timedelta
from models import User, UserResponse
from google.oauth2 import service_account
from googleapiclient.discovery import build
import pytz

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add these constants at the top of the file
SCOPES = ['https://www.googleapis.com/auth/calendar']
SERVICE_ACCOUNT_FILE = 'service-account.json'
CALENDAR_EMAIL = 'skillswapcalendarservice@gmail.com'

def get_calendar_service():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('calendar', 'v3', credentials=credentials)

class ProfileData(BaseModel):
    uid: str
    name: str
    bio: Optional[str] = None
    country: str
    profile_picture_url: Optional[str] = None

class AvailabilitySlot(BaseModel):
    date: str  # ISO format date string
    time_slots: list[str]  # List of time slots for that date

class SessionRequest(BaseModel):
    student_id: str
    teacher_id: str
    date: str
    time_slot: str
    message: str

@app.get("/")
async def root():
    return {"message": "SkillSwap API is running"}

@app.post("/api/profile", response_model=UserResponse)
async def update_profile(user_data: User):
    try:
        # Create a user document in Firestore
        user_ref = db.collection('users').document(user_data.uid)
        
        # Convert the user data to a dictionary
        user_dict = user_data.model_dump()
        
        # Update the document
        user_ref.set(user_dict, merge=True)
        
        # Get the updated document
        updated_user = user_ref.get()
        
        if not updated_user.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        return UserResponse(**updated_user.to_dict())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        # Get user document from Firestore
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert Firestore document to dict
        user_data = user_doc.to_dict()
        
        # Convert Firestore timestamps to ISO format strings
        if 'created_at' in user_data:
            user_data['created_at'] = user_data['created_at'].isoformat()
        if 'updated_at' in user_data:
            user_data['updated_at'] = user_data['updated_at'].isoformat()
        
        return user_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/profile/{uid}", response_model=UserResponse)
async def update_user_profile(uid: str, user_data: User):
    try:
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Update the document with new data
        update_data = user_data.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow()
        user_ref.update(update_data)
        
        # Get the updated document
        updated_user = user_ref.get()
        return UserResponse(**updated_user.to_dict())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile/{uid}/skills")
async def update_user_skills(uid: str, learning_skills: list[str] = None, teaching_skills: list[str] = None):
    try:
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        update_data = {}
        if learning_skills is not None:
            update_data['learning_skills'] = learning_skills
        if teaching_skills is not None:
            update_data['teaching_skills'] = teaching_skills
            
        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            user_ref.update(update_data)
            
        return {"message": "Skills updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile/{uid}/availability")
async def update_user_availability(uid: str, availability: dict):
    try:
        # Get user document
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate the availability data
        if not isinstance(availability.get('availability'), dict):
            raise HTTPException(status_code=400, detail="Invalid availability format")

        # Update user document with new availability
        user_ref.update({
            'availability': availability['availability'],
            'updated_at': datetime.now().isoformat()
        })

        return {"message": "Availability updated successfully"}

    except Exception as e:
        print(f"Error updating availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/request")
async def request_session(request: SessionRequest):
    try:
        # Get both users' documents
        student_doc = db.collection('users').document(request.student_id).get()
        teacher_doc = db.collection('users').document(request.teacher_id).get()
        
        if not student_doc.exists or not teacher_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Create a new session request document
        session_ref = db.collection('session_requests').document()
        session_data = {
            'student_id': request.student_id,
            'teacher_id': request.teacher_id,
            'date': request.date,
            'time_slot': request.time_slot,
            'message': request.message,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        session_ref.set(session_data)
        
        return {"message": "Session request sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/create")
async def create_session(
    request_id: str,
    sender_id: str,
    receiver_id: str,
    date: str,
    time: str,
    skill: str
):
    try:
        # Get user emails from Firestore
        sender_doc = db.collection('users').document(sender_id).get()
        receiver_doc = db.collection('users').document(receiver_id).get()
        
        if not sender_doc.exists or not receiver_doc.exists:
            raise HTTPException(status_code=404, detail="Users not found")
        
        sender_email = sender_doc.to_dict().get('email')
        receiver_email = receiver_doc.to_dict().get('email')
        
        # Parse date and time
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        time_obj = datetime.strptime(time, '%I:%M %p').time()
        start_time = datetime.combine(date_obj, time_obj)
        end_time = start_time + timedelta(hours=1)
        
        # Create calendar event
        calendar_service = get_calendar_service()
        
        event = {
            'summary': f'SkillSwap Session: {skill}',
            'description': f'A SkillSwap learning session for {skill}',
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
            'attendees': [
                {'email': sender_email},
                {'email': receiver_email},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': request_id,
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }
        }
        
        event = calendar_service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        meet_link = event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri')
        
        return {
            "message": "Session created successfully",
            "meet_link": meet_link
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.get("/api/sessions/requests/sent/{user_id}")
async def get_sent_requests(user_id: str):
    try:
        # Get all sent requests
        requests_ref = db.collection('session_requests')
        requests_query = requests_ref.where('student_id', '==', user_id)
        requests = requests_query.get()
        
        # Get receiver details for each request
        requests_data = []
        for request in requests:
            request_data = request.to_dict()
            receiver_doc = db.collection('users').document(request_data['teacher_id']).get()
            if receiver_doc.exists:
                request_data['receiver'] = receiver_doc.to_dict()
                request_data['id'] = request.id
                requests_data.append(request_data)
        
        return requests_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/requests/received/{user_id}")
async def get_received_requests(user_id: str):
    try:
        # Get all received requests
        requests_ref = db.collection('session_requests')
        requests_query = requests_ref.where('teacher_id', '==', user_id)
        requests = requests_query.get()
        
        # Get sender details for each request
        requests_data = []
        for request in requests:
            request_data = request.to_dict()
            sender_doc = db.collection('users').document(request_data['student_id']).get()
            if sender_doc.exists:
                request_data['sender'] = sender_doc.to_dict()
                request_data['id'] = request.id
                requests_data.append(request_data)
        
        return requests_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/requests/{request_id}/accept")
async def accept_request(request_id: str):
    try:
        print(f"\n=== Accepting Request {request_id} ===")
        
        # Get the request
        request_ref = db.collection('session_requests').document(request_id)
        request_doc = request_ref.get()
        
        if not request_doc.exists:
            print(f"Error: Request {request_id} not found")
            raise HTTPException(status_code=404, detail="Request not found")
            
        request_data = request_doc.to_dict()
        print(f"Request data: {request_data}")
        
        # Update request status
        print("Updating request status to 'accepted'")
        request_ref.update({
            'status': 'accepted',
            'updated_at': datetime.now().isoformat()
        })
        
        # Create Google Meet event
        print("Initializing calendar service")
        calendar_service = get_calendar_service()
        
        # Get user emails
        print("Fetching user emails")
        student_doc = db.collection('users').document(request_data['student_id']).get()
        teacher_doc = db.collection('users').document(request_data['teacher_id']).get()
        
        if not student_doc.exists or not teacher_doc.exists:
            print(f"Error: Users not found. Student exists: {student_doc.exists}, Teacher exists: {teacher_doc.exists}")
            raise HTTPException(status_code=404, detail="Users not found")
        
        student_email = student_doc.to_dict().get('email')
        teacher_email = teacher_doc.to_dict().get('email')
        print(f"Student email: {student_email}")
        print(f"Teacher email: {teacher_email}")
        
        # Parse date and time
        print("Parsing date and time")
        date_obj = datetime.strptime(request_data['date'], '%Y-%m-%d')
        time_obj = datetime.strptime(request_data['time_slot'], '%I:%M %p').time()
        
        # Create a timezone-aware datetime
        local_tz = pytz.timezone('America/New_York')  # Use the appropriate timezone
        local_dt = local_tz.localize(datetime.combine(date_obj, time_obj))
        
        # Convert to UTC for storage
        utc_dt = local_dt.astimezone(pytz.UTC)
        start_time = utc_dt
        end_time = start_time + timedelta(hours=1)
        
        print(f"Local start time: {local_dt}")
        print(f"UTC start time: {start_time}")
        print(f"UTC end time: {end_time}")
        
        try:
            print("Attempting to create calendar event")
            # Get the service account's calendar ID
            calendar_list = calendar_service.calendarList().list().execute()
            calendar_id = None
            
            # Look for the primary calendar
            for calendar in calendar_list.get('items', []):
                if calendar.get('primary'):
                    calendar_id = calendar['id']
                    break
            
            # If no primary calendar found, create a new calendar
            if not calendar_id:
                print("No primary calendar found, creating new calendar")
                calendar = {
                    'summary': 'SkillSwap Sessions',
                    'timeZone': 'America/New_York'  # Set the calendar's timezone
                }
                created_calendar = calendar_service.calendars().insert(body=calendar).execute()
                calendar_id = created_calendar['id']
                print(f"Created new calendar with ID: {calendar_id}")
                
                # Share the calendar with the Gmail account
                rule = {
                    'scope': {
                        'type': 'user',
                        'value': CALENDAR_EMAIL
                    },
                    'role': 'owner'
                }
                calendar_service.acl().insert(calendarId=calendar_id, body=rule).execute()
                print(f"Shared calendar with {CALENDAR_EMAIL}")
            
            print(f"Using calendar ID: {calendar_id}")
            
            # Create a Google Meet link
            meet_link = f"https://meet.google.com/{request_id[:8]}-{request_id[8:12]}-{request_id[12:16]}"
            
            # Create calendar event without attendees
            event = {
                'summary': f'SkillSwap Session',
                'description': f'A SkillSwap learning session\n\nAttendees:\n- {student_email}\n- {teacher_email}\n\nJoin Google Meet: {meet_link}',
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'America/New_York',  # Specify the timezone
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'America/New_York',  # Specify the timezone
                }
            }
            
            # Create the event without sending updates
            event = calendar_service.events().insert(
                calendarId=calendar_id,
                body=event,
                sendUpdates='none'  # Don't send email notifications
            ).execute()
            print("Calendar event created successfully")
            
            event_id = event.get('id')
            print(f"Event ID: {event_id}")
            
            # Create calendar links with local time
            print("Creating calendar links")
            calendar_links = {
                'google': f'https://calendar.google.com/calendar/render?action=TEMPLATE&text=SkillSwap Session&dates={local_dt.strftime("%Y%m%dT%H%M%S")}/{end_time.astimezone(local_tz).strftime("%Y%m%dT%H%M%S")}&details=Join Google Meet: {meet_link}',
                'outlook': f'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=SkillSwap Session&startdt={local_dt.isoformat()}&enddt={end_time.astimezone(local_tz).isoformat()}&body=Join Google Meet: {meet_link}',
                'yahoo': f'https://calendar.yahoo.com/?v=60&title=SkillSwap Session&st={local_dt.strftime("%Y%m%dT%H%M%S")}&et={end_time.astimezone(local_tz).strftime("%Y%m%dT%H%M%S")}&desc=Join Google Meet: {meet_link}'
            }
            print(f"Calendar links created: {calendar_links}")
            
            # Update request with meet link and calendar details
            print("Updating request with calendar details")
            request_ref.update({
                'meet_link': meet_link,
                'calendar_links': calendar_links,
                'event_id': event_id
            })
            print("Request updated successfully")
            
            response_data = {
                "message": "Request accepted successfully",
                "meet_link": meet_link,
                "calendar_links": calendar_links,
                "event_id": event_id
            }
            print(f"Returning response: {response_data}")
            return response_data
            
        except Exception as calendar_error:
            print(f"Calendar API Error: {str(calendar_error)}")
            print(f"Error type: {type(calendar_error)}")
            print(f"Error details: {calendar_error.__dict__}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create calendar event: {str(calendar_error)}"
            )
        
    except Exception as e:
        print(f"General Error: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {e.__dict__}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/requests/{request_id}/decline")
async def decline_request(request_id: str):
    try:
        request_ref = db.collection('session_requests').document(request_id)
        request_doc = request_ref.get()
        
        if not request_doc.exists:
            raise HTTPException(status_code=404, detail="Request not found")
            
        request_ref.update({
            'status': 'declined',
            'updated_at': datetime.now().isoformat()
        })
        
        return {"message": "Request declined successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))