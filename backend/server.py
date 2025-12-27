from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create API router
api_router = APIRouter(prefix="/api")

# Emergent Auth Session Endpoint
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# ============= MODELS =============

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str  # 'marka', 'influencer', 'admin'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    user_type: str
    picture: Optional[str] = None
    created_at: datetime

# Influencer Profile Models
class SocialMedia(BaseModel):
    instagram: Optional[str] = None
    tiktok: Optional[str] = None
    youtube: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    facebook: Optional[str] = None

class PortfolioItem(BaseModel):
    title: str
    description: str
    url: Optional[str] = None
    image_url: Optional[str] = None

class InfluencerProfileCreate(BaseModel):
    bio: str
    specialties: List[str]
    portfolio_items: List[PortfolioItem] = []
    starting_price: float
    social_media: SocialMedia
    image_url: Optional[str] = None

class InfluencerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    profile_id: str
    user_id: str
    bio: str
    specialties: List[str]
    portfolio_items: List[PortfolioItem]
    starting_price: float
    social_media: SocialMedia
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Job Post Models
class JobPostCreate(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    platforms: List[str]  # ['instagram', 'tiktok', etc.]

class JobPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    job_id: str
    brand_user_id: str
    brand_name: str
    title: str
    description: str
    category: str
    budget: float
    platforms: List[str]
    status: str  # 'open', 'closed', 'filled'
    created_at: datetime

# Application Models
class ApplicationCreate(BaseModel):
    job_id: str
    message: str

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    application_id: str
    job_id: str
    influencer_user_id: str
    influencer_name: str
    influencer_profile_id: Optional[str] = None
    message: str
    status: str  # 'pending', 'accepted', 'rejected'
    created_at: datetime

# Match Models
class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str
    job_id: str
    job_title: str
    brand_user_id: str
    brand_name: str
    influencer_user_id: str
    influencer_name: str
    status: str  # 'active', 'completed', 'cancelled'
    created_at: datetime

# Message Models
class MessageCreate(BaseModel):
    message: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    match_id: str
    sender_user_id: str
    sender_name: str
    message: str
    timestamp: datetime

# Commission Models
class CommissionSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    percentage: float
    updated_at: datetime

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    match_id: str
    job_title: str
    brand_name: str
    influencer_name: str
    amount: float
    commission: float
    created_at: datetime

# Contact Models
class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str
    user_type: Optional[str] = None  # 'marka' or 'influencer'

class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contact_id: str
    name: str
    email: str
    message: str
    user_type: Optional[str] = None
    created_at: datetime

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_current_user(request: Request) -> Optional[User]:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Check session in database
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_role(request: Request, allowed_roles: List[str]) -> User:
    user = await require_auth(request)
    if user.user_type not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

# ============= AUTH ROUTES =============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": password_hash,
        "name": user_data.name,
        "user_type": user_data.user_type,
        "picture": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    # Return user without password
    user_doc.pop("password_hash")
    user_doc.pop("_id")
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return response

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    # Return user without password
    user_doc.pop("password_hash")
    user_doc.pop("_id")
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return response

@api_router.post("/auth/google-session")
async def google_session(x_session_id: str = Header(...)):
    # Exchange session_id for user data
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": x_session_id},
                timeout=10.0
            )
            response.raise_for_status()
            google_user = response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": google_user["email"]}, {"_id": 0})
    
    if user_doc:
        # Update user info
        await db.users.update_one(
            {"email": google_user["email"]},
            {"$set": {
                "name": google_user["name"],
                "picture": google_user.get("picture")
            }}
        )
        user_id = user_doc["user_id"]
    else:
        # New user - needs to choose user type (return special flag)
        return JSONResponse(
            content={
                "new_user": True,
                "email": google_user["email"],
                "name": google_user["name"],
                "picture": google_user.get("picture"),
                "temp_session": google_user["session_token"]
            }
        )
    
    # Create/update session
    session_token = google_user["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": session_doc},
        upsert=True
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return response

@api_router.post("/auth/complete-google-signup")
async def complete_google_signup(
    user_type: str,
    temp_session: str = Header(...)
):
    # Get Google user data from temp session
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": temp_session},
                timeout=10.0
            )
            response.raise_for_status()
            google_user = response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": google_user["email"],
        "name": google_user["name"],
        "user_type": user_type,
        "picture": google_user.get("picture"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = google_user["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    user_doc.pop("_id")
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await require_auth(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# ============= INFLUENCER PROFILE ROUTES =============

@api_router.post("/profile", response_model=InfluencerProfile)
async def create_profile(request: Request, profile_data: InfluencerProfileCreate):
    user = await require_role(request, ["influencer"])
    
    # Check if profile exists
    existing = await db.influencer_profiles.find_one({"user_id": user.user_id})
    
    profile_id = existing["profile_id"] if existing else f"profile_{uuid.uuid4().hex[:12]}"
    
    profile_doc = {
        "profile_id": profile_id,
        "user_id": user.user_id,
        **profile_data.model_dump(),
        "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if existing:
        await db.influencer_profiles.update_one(
            {"user_id": user.user_id},
            {"$set": profile_doc}
        )
    else:
        await db.influencer_profiles.insert_one(profile_doc)
    
    profile_doc.pop("_id", None)
    return InfluencerProfile(**profile_doc)

@api_router.get("/profile/me", response_model=Optional[InfluencerProfile])
async def get_my_profile(request: Request):
    user = await require_role(request, ["influencer"])
    
    profile_doc = await db.influencer_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not profile_doc:
        return None
    
    return InfluencerProfile(**profile_doc)

@api_router.get("/profiles", response_model=List[InfluencerProfile])
async def get_profiles():
    profiles = await db.influencer_profiles.find({}, {"_id": 0}).to_list(100)
    return [InfluencerProfile(**p) for p in profiles]

@api_router.get("/profile/{profile_id}", response_model=InfluencerProfile)
async def get_profile(profile_id: str):
    profile_doc = await db.influencer_profiles.find_one({"profile_id": profile_id}, {"_id": 0})
    
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return InfluencerProfile(**profile_doc)

# ============= JOB POST ROUTES =============

@api_router.post("/jobs", response_model=JobPost)
async def create_job(request: Request, job_data: JobPostCreate):
    user = await require_role(request, ["marka"])
    
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    job_doc = {
        "job_id": job_id,
        "brand_user_id": user.user_id,
        "brand_name": user.name,
        **job_data.model_dump(),
        "status": "open",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.job_posts.insert_one(job_doc)
    
    job_doc.pop("_id")
    return JobPost(**job_doc)

@api_router.get("/jobs", response_model=List[JobPost])
async def get_jobs(
    category: Optional[str] = None,
    platform: Optional[str] = None,
    status: str = "open"
):
    query = {"status": status}
    if category:
        query["category"] = category
    if platform:
        query["platforms"] = platform
    
    jobs = await db.job_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [JobPost(**j) for j in jobs]

@api_router.get("/jobs/my-jobs", response_model=List[JobPost])
async def get_my_jobs(request: Request):
    user = await require_role(request, ["marka"])
    
    jobs = await db.job_posts.find(
        {"brand_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [JobPost(**j) for j in jobs]

@api_router.get("/jobs/{job_id}", response_model=JobPost)
async def get_job(job_id: str):
    job_doc = await db.job_posts.find_one({"job_id": job_id}, {"_id": 0})
    
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobPost(**job_doc)

@api_router.delete("/jobs/{job_id}")
async def delete_job(request: Request, job_id: str):
    user = await require_role(request, ["marka", "admin"])
    
    job_doc = await db.job_posts.find_one({"job_id": job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if user.user_type == "marka" and job_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    
    await db.job_posts.delete_one({"job_id": job_id})
    return {"message": "Job deleted"}

# ============= APPLICATION ROUTES =============

@api_router.post("/applications", response_model=Application)
async def create_application(request: Request, app_data: ApplicationCreate):
    user = await require_role(request, ["influencer"])
    
    # Check if job exists
    job_doc = await db.job_posts.find_one({"job_id": app_data.job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_doc["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not open")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "job_id": app_data.job_id,
        "influencer_user_id": user.user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    # Get profile
    profile = await db.influencer_profiles.find_one({"user_id": user.user_id})
    
    application_id = f"app_{uuid.uuid4().hex[:12]}"
    
    app_doc = {
        "application_id": application_id,
        "job_id": app_data.job_id,
        "influencer_user_id": user.user_id,
        "influencer_name": user.name,
        "influencer_profile_id": profile["profile_id"] if profile else None,
        "message": app_data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.applications.insert_one(app_doc)
    
    app_doc.pop("_id")
    return Application(**app_doc)

@api_router.get("/applications/my-applications", response_model=List[Application])
async def get_my_applications(request: Request):
    user = await require_role(request, ["influencer"])
    
    apps = await db.applications.find(
        {"influencer_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [Application(**a) for a in apps]

@api_router.get("/jobs/{job_id}/applications", response_model=List[Application])
async def get_job_applications(request: Request, job_id: str):
    user = await require_role(request, ["marka"])
    
    # Verify job ownership
    job_doc = await db.job_posts.find_one({"job_id": job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    
    apps = await db.applications.find(
        {"job_id": job_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [Application(**a) for a in apps]

@api_router.post("/applications/{application_id}/accept", response_model=Match)
async def accept_application(request: Request, application_id: str):
    user = await require_role(request, ["marka"])
    
    # Get application
    app_doc = await db.applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify job ownership
    job_doc = await db.job_posts.find_one({"job_id": app_doc["job_id"]})
    if job_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    
    # Update application
    await db.applications.update_one(
        {"application_id": application_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Create match
    match_id = f"match_{uuid.uuid4().hex[:12]}"
    
    match_doc = {
        "match_id": match_id,
        "job_id": app_doc["job_id"],
        "job_title": job_doc["title"],
        "brand_user_id": user.user_id,
        "brand_name": user.name,
        "influencer_user_id": app_doc["influencer_user_id"],
        "influencer_name": app_doc["influencer_name"],
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.matches.insert_one(match_doc)
    
    # Update job status
    await db.job_posts.update_one(
        {"job_id": app_doc["job_id"]},
        {"$set": {"status": "filled"}}
    )
    
    match_doc.pop("_id")
    return Match(**match_doc)

# ============= MATCH & MESSAGE ROUTES =============

@api_router.get("/matches/my-matches", response_model=List[Match])
async def get_my_matches(request: Request):
    user = await require_auth(request)
    
    if user.user_type == "marka":
        query = {"brand_user_id": user.user_id}
    elif user.user_type == "influencer":
        query = {"influencer_user_id": user.user_id}
    else:
        raise HTTPException(status_code=403, detail="Invalid user type")
    
    matches = await db.matches.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [Match(**m) for m in matches]

@api_router.get("/matches/{match_id}/messages", response_model=List[Message])
async def get_messages(request: Request, match_id: str):
    user = await require_auth(request)
    
    # Verify match access
    match_doc = await db.matches.find_one({"match_id": match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    messages = await db.messages.find(
        {"match_id": match_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    return [Message(**m) for m in messages]

@api_router.post("/matches/{match_id}/messages", response_model=Message)
async def send_message(request: Request, match_id: str, msg_data: MessageCreate):
    user = await require_auth(request)
    
    # Verify match access
    match_doc = await db.matches.find_one({"match_id": match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    msg_doc = {
        "message_id": message_id,
        "match_id": match_id,
        "sender_user_id": user.user_id,
        "sender_name": user.name,
        "message": msg_data.message,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(msg_doc)
    
    msg_doc.pop("_id")
    return Message(**msg_doc)

# ============= ADMIN ROUTES =============

@api_router.get("/admin/users", response_model=List[User])
async def admin_get_users(request: Request):
    await require_role(request, ["admin"])
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/admin/jobs", response_model=List[JobPost])
async def admin_get_jobs(request: Request):
    await require_role(request, ["admin"])
    
    jobs = await db.job_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [JobPost(**j) for j in jobs]

@api_router.get("/admin/matches", response_model=List[Match])
async def admin_get_matches(request: Request):
    await require_role(request, ["admin"])
    
    matches = await db.matches.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Match(**m) for m in matches]

@api_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    await require_role(request, ["admin"])
    
    total_users = await db.users.count_documents({})
    total_brands = await db.users.count_documents({"user_type": "marka"})
    total_influencers = await db.users.count_documents({"user_type": "influencer"})
    total_jobs = await db.job_posts.count_documents({})
    open_jobs = await db.job_posts.count_documents({"status": "open"})
    total_matches = await db.matches.count_documents({})
    total_applications = await db.applications.count_documents({})
    
    return {
        "total_users": total_users,
        "total_brands": total_brands,
        "total_influencers": total_influencers,
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "total_matches": total_matches,
        "total_applications": total_applications
    }

@api_router.get("/admin/commission", response_model=CommissionSettings)
async def get_commission(request: Request):
    await require_role(request, ["admin"])
    
    settings = await db.commission_settings.find_one({}, {"_id": 0})
    if not settings:
        # Default commission
        settings = {
            "percentage": 10.0,
            "updated_at": datetime.now(timezone.utc)
        }
        await db.commission_settings.insert_one(settings)
    
    return CommissionSettings(**settings)

@api_router.put("/admin/commission")
async def update_commission(request: Request, percentage: float):
    await require_role(request, ["admin"])
    
    if percentage < 0 or percentage > 100:
        raise HTTPException(status_code=400, detail="Invalid percentage")
    
    settings = {
        "percentage": percentage,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.commission_settings.update_one({}, {"$set": settings}, upsert=True)
    
    return CommissionSettings(**settings)

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(request: Request, user_id: str):
    await require_role(request, ["admin"])
    
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cleanup related data
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.influencer_profiles.delete_many({"user_id": user_id})
    
    return {"message": "User deleted"}

# ============= CONTACT ROUTES =============

@api_router.post("/contact", response_model=Contact)
async def create_contact(contact_data: ContactCreate):
    contact_id = f"contact_{uuid.uuid4().hex[:12]}"
    
    contact_doc = {
        "contact_id": contact_id,
        **contact_data.model_dump(),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.contacts.insert_one(contact_doc)
    
    contact_doc.pop("_id")
    return Contact(**contact_doc)

@api_router.get("/admin/contacts", response_model=List[Contact])
async def admin_get_contacts(request: Request):
    await require_role(request, ["admin"])
    
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Contact(**c) for c in contacts]

# ============= PUBLIC ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "FLULANCE API", "status": "active"}

# Include router in app
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
