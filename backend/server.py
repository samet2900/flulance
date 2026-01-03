from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import httpx
import shutil
import mimetypes
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@flulance.com')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://influencer-hub-110.preview.emergentagent.com')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
    badge: Optional[str] = None  # 'new', 'verified', 'top'
    is_online: bool = False
    last_active: Optional[datetime] = None
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

# Brand Profile Models
class BrandProfileCreate(BaseModel):
    company_name: str
    industry: str
    founded_year: Optional[int] = None
    employee_count: Optional[str] = None  # "1-10", "11-50", "51-200", "200+"
    website: Optional[str] = None
    logo_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    social_media: Optional[dict] = None

class BrandProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    profile_id: str
    user_id: str
    company_name: str
    industry: str
    founded_year: Optional[int] = None
    employee_count: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    social_media: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

# Job Post Models
class JobPostCreate(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    platforms: List[str]  # ['instagram', 'tiktok', etc.]
    duration_days: Optional[int] = 15  # İlan süresi (max 15 gün)
    deadline_days: Optional[int] = None  # Teslim süresi (gün)
    start_date: Optional[str] = None
    content_requirements: Optional[dict] = None  # {"videos": 3, "images": 5}
    revision_rounds: Optional[int] = 1  # Revizyon hakkı
    experience_level: Optional[str] = None  # "beginner", "intermediate", "expert"
    min_followers: Optional[int] = None  # Minimum takipçi sayısı
    target_audience: Optional[dict] = None  # {"age_range": "18-24", "location": "Turkey"}
    copyright: Optional[str] = None  # "brand", "influencer", "shared"
    is_featured: Optional[bool] = False  # Öne çıkan ilan
    is_urgent: Optional[bool] = False  # Acil ilan

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
    duration_days: Optional[int] = 15  # İlan süresi
    expires_at: Optional[datetime] = None  # Sona erme tarihi
    deadline_days: Optional[int] = None
    start_date: Optional[str] = None
    content_requirements: Optional[dict] = None
    revision_rounds: Optional[int] = 1
    experience_level: Optional[str] = None
    min_followers: Optional[int] = None
    target_audience: Optional[dict] = None
    copyright: Optional[str] = None
    is_featured: Optional[bool] = False
    is_urgent: Optional[bool] = False
    application_count: Optional[int] = 0
    view_count: Optional[int] = 0  # Görüntülenme sayısı
    approval_status: Optional[str] = "pending"  # 'pending', 'approved', 'rejected'
    rejection_reason: Optional[str] = None  # Red sebebi
    status: str  # 'open', 'closed', 'filled', 'expired'
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
    attachment: Optional[dict] = None
    is_read: bool = False

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

# Notification Models
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    user_id: str
    type: str  # 'application', 'match', 'message'
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime

# Announcement Models
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    type: str  # 'news', 'update', 'promotion'
    is_pinned: bool = False  # Ana sayfada gösterilsin mi?

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    announcement_id: str
    title: str
    content: str
    type: str
    is_pinned: bool = False
    created_at: datetime

# Favorite Models
class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    favorite_id: str
    user_id: str
    job_id: str
    created_at: datetime

# Review Models (FAZ 2)
class ReviewCreate(BaseModel):
    match_id: str
    rating: int  # 1-5 yıldız
    comment: str
    review_type: str  # 'brand_to_influencer' veya 'influencer_to_brand'

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    match_id: str
    reviewer_user_id: str
    reviewer_name: str
    reviewed_user_id: str
    reviewed_name: str
    rating: int
    comment: str
    review_type: str
    created_at: datetime

# Influencer Statistics Models (FAZ 2)
class InfluencerStatsCreate(BaseModel):
    instagram_followers: Optional[int] = None
    instagram_engagement: Optional[float] = None  # Engagement rate %
    tiktok_followers: Optional[int] = None
    tiktok_engagement: Optional[float] = None
    youtube_subscribers: Optional[int] = None
    youtube_avg_views: Optional[int] = None
    twitter_followers: Optional[int] = None
    total_reach: Optional[int] = None

class InfluencerStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    stats_id: str
    user_id: str
    instagram_followers: Optional[int] = None
    instagram_engagement: Optional[float] = None
    tiktok_followers: Optional[int] = None
    tiktok_engagement: Optional[float] = None
    youtube_subscribers: Optional[int] = None
    youtube_avg_views: Optional[int] = None
    twitter_followers: Optional[int] = None
    total_reach: Optional[int] = None
    completed_jobs: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0
    updated_at: datetime

# Badge/Verification Models (FAZ 2)
class BadgeRequest(BaseModel):
    badge_type: str  # 'verified', 'top', 'rising'
    reason: Optional[str] = None

class Badge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    badge_id: str
    user_id: str
    badge_type: str  # 'verified', 'top', 'rising', 'new'
    awarded_at: datetime
    awarded_by: Optional[str] = None  # Admin user_id

# ============= FAZ 3 MODELS =============

# Contract Models
class ContractCreate(BaseModel):
    match_id: str
    title: str
    description: str
    total_amount: float
    payment_terms: str  # 'upfront', 'milestone', 'completion'
    start_date: str
    end_date: str
    terms_and_conditions: Optional[str] = None

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contract_id: str
    match_id: str
    job_id: str
    brand_user_id: str
    influencer_user_id: str
    title: str
    description: str
    total_amount: float
    payment_terms: str
    start_date: str
    end_date: str
    terms_and_conditions: Optional[str] = None
    status: str  # 'draft', 'pending', 'active', 'completed', 'cancelled'
    brand_signed: bool = False
    influencer_signed: bool = False
    created_at: datetime
    updated_at: datetime

# Milestone Models
class MilestoneCreate(BaseModel):
    title: str
    description: str
    due_date: str
    amount: float

class Milestone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    milestone_id: str
    contract_id: str
    title: str
    description: str
    due_date: str
    amount: float
    status: str  # 'pending', 'in_progress', 'submitted', 'approved', 'rejected'
    submission_note: Optional[str] = None
    submission_files: List[str] = []
    created_at: datetime
    updated_at: datetime

# Media Library Models
class MediaItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    media_id: str
    user_id: str
    filename: str
    original_filename: str
    file_type: str  # 'image', 'video', 'document'
    file_size: int
    url: str
    thumbnail_url: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None
    created_at: datetime

# Chat Attachment Models
class ChatAttachment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    attachment_id: str
    message_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    url: str
    thumbnail_url: Optional[str] = None

# ============= SETTINGS MODELS =============

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class EmailChange(BaseModel):
    new_email: EmailStr
    password: str

class NotificationSettings(BaseModel):
    email_new_job: bool = True
    email_application_status: bool = True
    email_messages: bool = True
    email_marketing: bool = False
    push_new_job: bool = True
    push_application_status: bool = True
    push_messages: bool = True

class PrivacySettings(BaseModel):
    profile_visible: bool = True
    show_stats_to_brands: bool = True
    show_in_search: bool = True

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    theme: str = "dark"
    language: str = "tr"
    notifications: NotificationSettings = NotificationSettings()
    privacy: PrivacySettings = PrivacySettings()
    updated_at: datetime

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    favorite_id: str
    user_id: str
    job_id: str
    title: str
    description: Optional[str] = None
    category: str
    budget: Optional[float] = None
    is_featured: bool = False
    is_urgent: bool = False
    favorited_at: datetime

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ============= ETAP 5 MODELS =============

class BriefCreate(BaseModel):
    """Tersine ilan (brief) oluşturma modeli"""
    title: str
    description: str
    category: str
    budget_min: float
    budget_max: float
    platforms: List[str]
    deadline: Optional[str] = None
    requirements: Optional[str] = None

class Brief(BaseModel):
    model_config = ConfigDict(extra="ignore")
    brief_id: str
    brand_user_id: str
    brand_name: str
    title: str
    description: str
    category: str
    budget_min: float
    budget_max: float
    platforms: List[str]
    deadline: Optional[str] = None
    requirements: Optional[str] = None
    status: str = "open"  # open, closed, completed
    proposal_count: int = 0
    created_at: datetime

class ProposalCreate(BaseModel):
    """Influencer teklif modeli"""
    brief_id: str
    proposed_price: float
    message: str
    delivery_time: str  # "3 gün", "1 hafta" etc

class Proposal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    proposal_id: str
    brief_id: str
    influencer_user_id: str
    influencer_name: str
    proposed_price: float
    message: str
    delivery_time: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime

class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    link: Optional[str] = None
    brand_name: Optional[str] = None
    completion_date: Optional[str] = None
    metrics: Optional[dict] = None  # views, likes, engagement etc
    created_at: datetime

class SocialMediaAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform: str  # instagram, tiktok, youtube, twitter
    username: str
    followers: int = 0
    profile_url: Optional[str] = None
    verified: bool = False

class CategoryAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str
    user_id: str
    category: str
    platforms: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    email_notification: bool = True
    push_notification: bool = False
    created_at: datetime

class IdentityVerification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    verification_id: str
    user_id: str
    verification_type: str  # tc_kimlik, vergi_no
    document_number: str  # Hashed/encrypted
    full_name: str
    status: str = "pending"  # pending, approved, rejected
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class Dispute(BaseModel):
    model_config = ConfigDict(extra="ignore")
    dispute_id: str
    match_id: str
    reporter_user_id: str
    reporter_name: str
    reported_user_id: str
    reported_name: str
    reason: str
    description: str
    evidence_urls: List[str] = []
    status: str = "open"  # open, under_review, resolved, closed
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class ContractSignature(BaseModel):
    model_config = ConfigDict(extra="ignore")
    signature_id: str
    contract_id: str
    user_id: str
    user_name: str
    user_type: str
    signed_at: datetime
    ip_address: str
    user_agent: str
    accepted_terms: bool = True

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend API (non-blocking)"""
    if not resend.api_key or resend.api_key == 're_placeholder_key':
        logging.warning(f"Email not sent (no API key): {subject} to {to_email}")
        return {"status": "skipped", "message": "Email API key not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent: {subject} to {to_email}")
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        return {"status": "error", "message": str(e)}

def get_password_reset_email_html(reset_link: str, user_name: str) -> str:
    """Generate password reset email HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Şifre Sıfırlama - FLULANCE</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="background: linear-gradient(90deg, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">FLULANCE</h1>
            </div>
            
            <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Merhaba {user_name}!</h2>
            
            <p style="color: #9ca3af; font-size: 16px; line-height: 1.6;">
                Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; background: linear-gradient(90deg, #d946ef, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                    Şifremi Sıfırla
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Bu link 1 saat içinde geçerliliğini yitirecektir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © 2026 FLULANCE. Tüm hakları saklıdır.
            </p>
        </div>
    </body>
    </html>
    """

def get_notification_email_html(title: str, message: str, action_link: str = None, action_text: str = None) -> str:
    """Generate notification email HTML"""
    action_button = ""
    if action_link and action_text:
        action_button = f"""
            <div style="text-align: center; margin: 30px 0;">
                <a href="{action_link}" style="display: inline-block; background: linear-gradient(90deg, #d946ef, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                    {action_text}
                </a>
            </div>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{title} - FLULANCE</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="background: linear-gradient(90deg, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">FLULANCE</h1>
            </div>
            
            <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">{title}</h2>
            
            <p style="color: #9ca3af; font-size: 16px; line-height: 1.6;">
                {message}
            </p>
            
            {action_button}
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © 2026 FLULANCE. Tüm hakları saklıdır.
            </p>
        </div>
    </body>
    </html>
    """

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

async def create_notification(user_id: str, type: str, title: str, message: str, link: Optional[str] = None):
    """Helper function to create notifications"""
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    notification_doc = {
        "notification_id": notification_id,
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "link": link,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.notifications.insert_one(notification_doc)

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
    
    # Convert datetime to ISO string for JSON serialization
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
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
    
    # Convert datetime to ISO string for JSON serialization
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
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
        samesite="lax",
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
        samesite="lax",
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

@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    """Request password reset - sends email with reset link"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    # Always return success (don't reveal if email exists)
    if not user:
        return {"message": "Şifre sıfırlama linki e-posta adresinize gönderildi."}
    
    # Generate reset token
    reset_token = uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "token": reset_token,
            "expires_at": expires_at,
            "used": False
        }},
        upsert=True
    )
    
    # Send email
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    html_content = get_password_reset_email_html(reset_link, user.get("name", "Kullanıcı"))
    
    await send_email(
        to_email=data.email,
        subject="Şifre Sıfırlama - FLULANCE",
        html_content=html_content
    )
    
    return {"message": "Şifre sıfırlama linki e-posta adresinize gönderildi."}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Reset password using token from email"""
    # Find valid reset token
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    })
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş link.")
    
    # Check expiry
    expires_at = reset_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun.")
    
    # Validate password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır.")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"user_id": reset_doc["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    # Clear all sessions for this user (security measure)
    await db.user_sessions.delete_many({"user_id": reset_doc["user_id"]})
    
    return {"message": "Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz."}

@api_router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    reset_doc = await db.password_resets.find_one({
        "token": token,
        "used": False
    })
    
    if not reset_doc:
        return {"valid": False, "message": "Geçersiz link."}
    
    expires_at = reset_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return {"valid": False, "message": "Link süresi dolmuş."}
    
    return {"valid": True}

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

# ============= BRAND PROFILE ROUTES =============

@api_router.post("/brand-profile", response_model=BrandProfile)
async def create_brand_profile(request: Request, profile_data: BrandProfileCreate):
    user = await require_role(request, ["marka"])
    
    # Check if profile exists
    existing = await db.brand_profiles.find_one({"user_id": user.user_id})
    
    profile_id = existing["profile_id"] if existing else f"brand_profile_{uuid.uuid4().hex[:12]}"
    
    profile_doc = {
        "profile_id": profile_id,
        "user_id": user.user_id,
        **profile_data.model_dump(),
        "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if existing:
        await db.brand_profiles.update_one(
            {"user_id": user.user_id},
            {"$set": profile_doc}
        )
    else:
        await db.brand_profiles.insert_one(profile_doc)
    
    profile_doc.pop("_id", None)
    return BrandProfile(**profile_doc)

@api_router.get("/brand-profile/me", response_model=Optional[BrandProfile])
async def get_my_brand_profile(request: Request):
    user = await require_role(request, ["marka"])
    
    profile_doc = await db.brand_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not profile_doc:
        return None
    
    return BrandProfile(**profile_doc)

@api_router.get("/brand-profile/{profile_id}", response_model=BrandProfile)
async def get_brand_profile(profile_id: str):
    profile_doc = await db.brand_profiles.find_one({"profile_id": profile_id}, {"_id": 0})
    
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return BrandProfile(**profile_doc)

# ============= JOB POST ROUTES =============

@api_router.post("/jobs", response_model=JobPost)
async def create_job(request: Request, job_data: JobPostCreate):
    user = await require_role(request, ["marka"])
    
    # Max 15 days duration
    duration_days = min(job_data.duration_days or 15, 15)
    
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=duration_days)
    
    job_doc = {
        "job_id": job_id,
        "brand_user_id": user.user_id,
        "brand_name": user.name,
        **job_data.model_dump(),
        "duration_days": duration_days,
        "expires_at": expires_at,
        "view_count": 0,
        "approval_status": "pending",  # Needs admin approval
        "rejection_reason": None,
        "status": "open",
        "created_at": now
    }
    
    await db.job_posts.insert_one(job_doc)
    
    # Create notification for admins
    admins = await db.users.find({"user_type": "admin"}, {"_id": 0, "user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            user_id=admin["user_id"],
            type="new",
            title="Yeni İlan Onay Bekliyor",
            message=f"{user.name} yeni bir ilan oluşturdu: {job_data.title}",
            link="/admin#jobs"
        )
    
    # Create notification for brand
    await create_notification(
        user_id=user.user_id,
        type="update",
        title="İlanınız Onay Bekliyor",
        message=f"'{job_data.title}' ilanınız admin onayı bekliyor.",
        link="/brand#jobs"
    )
    
    job_doc.pop("_id")
    return JobPost(**job_doc)

@api_router.get("/jobs", response_model=List[JobPost])
async def get_jobs(
    category: Optional[str] = None,
    platform: Optional[str] = None,
    status: str = "open"
):
    now = datetime.now(timezone.utc)
    
    # Only show approved and non-expired jobs on public feed
    query = {
        "status": status,
        "approval_status": "approved",
        "$or": [
            {"expires_at": {"$gt": now}},
            {"expires_at": None},
            {"expires_at": {"$exists": False}}
        ]
    }
    if category:
        query["category"] = category
    if platform:
        query["platforms"] = platform
    
    jobs = await db.job_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get application counts and increment view count
    result = []
    for j in jobs:
        app_count = await db.applications.count_documents({"job_id": j["job_id"]})
        j["application_count"] = app_count
        # Set defaults for new fields if not present
        j.setdefault("is_featured", False)
        j.setdefault("is_urgent", False)
        j.setdefault("view_count", 0)
        j.setdefault("approval_status", "approved")  # Legacy jobs are approved
        j.setdefault("duration_days", 15)
        result.append(JobPost(**j))
    
    return result

@api_router.get("/jobs/my-jobs", response_model=List[JobPost])
async def get_my_jobs(request: Request):
    user = await require_role(request, ["marka"])
    
    jobs = await db.job_posts.find(
        {"brand_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    now = datetime.now(timezone.utc)
    result = []
    for j in jobs:
        # Check if expired
        expires_at = j.get("expires_at")
        if expires_at:
            # Ensure timezone-aware comparison
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now and j.get("status") == "open":
                j["status"] = "expired"
                # Update in DB
                await db.job_posts.update_one(
                    {"job_id": j["job_id"]},
                    {"$set": {"status": "expired"}}
                )
        
        j.setdefault("is_featured", False)
        j.setdefault("is_urgent", False)
        j.setdefault("application_count", 0)
        j.setdefault("view_count", 0)
        j.setdefault("approval_status", "approved")
        j.setdefault("duration_days", 15)
        result.append(JobPost(**j))
    
    return result

@api_router.get("/jobs/{job_id}", response_model=JobPost)
async def get_job(job_id: str):
    job_doc = await db.job_posts.find_one({"job_id": job_id}, {"_id": 0})
    
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Increment view count
    await db.job_posts.update_one(
        {"job_id": job_id},
        {"$inc": {"view_count": 1}}
    )
    
    job_doc.setdefault("view_count", 0)
    job_doc.setdefault("approval_status", "approved")
    job_doc.setdefault("duration_days", 15)
    
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

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    platforms: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_urgent: Optional[bool] = None
    status: Optional[str] = None

@api_router.put("/jobs/{job_id}")
async def update_job(request: Request, job_id: str, job_update: JobUpdate):
    user = await require_role(request, ["marka", "admin"])
    
    job_doc = await db.job_posts.find_one({"job_id": job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if user.user_type == "marka" and job_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    
    update_data = {k: v for k, v in job_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.job_posts.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )
    
    updated_doc = await db.job_posts.find_one({"job_id": job_id}, {"_id": 0})
    updated_doc.setdefault("is_featured", False)
    updated_doc.setdefault("is_urgent", False)
    updated_doc.setdefault("application_count", 0)
    
    return JobPost(**updated_doc)

# ============= ADMIN JOB MANAGEMENT =============

@api_router.get("/admin/jobs", response_model=List[JobPost])
async def admin_get_all_jobs(request: Request, approval_status: Optional[str] = None):
    """Admin can view all jobs with filters"""
    user = await require_role(request, ["admin"])
    
    query = {}
    if approval_status:
        query["approval_status"] = approval_status
    
    jobs = await db.job_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    result = []
    for j in jobs:
        app_count = await db.applications.count_documents({"job_id": j["job_id"]})
        j["application_count"] = app_count
        j.setdefault("is_featured", False)
        j.setdefault("is_urgent", False)
        j.setdefault("view_count", 0)
        j.setdefault("approval_status", "approved")
        j.setdefault("duration_days", 15)
        result.append(JobPost(**j))
    
    return result

class JobApproval(BaseModel):
    approval_status: str  # 'approved' or 'rejected'
    rejection_reason: Optional[str] = None

@api_router.put("/admin/jobs/{job_id}/approval")
async def admin_approve_job(request: Request, job_id: str, approval: JobApproval):
    """Admin approves or rejects a job"""
    user = await require_role(request, ["admin"])
    
    job_doc = await db.job_posts.find_one({"job_id": job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if approval.approval_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid approval status")
    
    update_data = {
        "approval_status": approval.approval_status
    }
    
    if approval.approval_status == "rejected" and approval.rejection_reason:
        update_data["rejection_reason"] = approval.rejection_reason
    
    await db.job_posts.update_one(
        {"job_id": job_id},
        {"$set": update_data}
    )
    
    # Notify the brand
    if approval.approval_status == "approved":
        await create_notification(
            user_id=job_doc["brand_user_id"],
            type="update",
            title="İlanınız Onaylandı! ✅",
            message=f"'{job_doc['title']}' ilanınız onaylandı ve yayınlandı.",
            link="/brand#jobs"
        )
    else:
        reason_text = f" Sebep: {approval.rejection_reason}" if approval.rejection_reason else ""
        await create_notification(
            user_id=job_doc["brand_user_id"],
            type="update",
            title="İlanınız Reddedildi ❌",
            message=f"'{job_doc['title']}' ilanınız reddedildi.{reason_text}",
            link="/brand#jobs"
        )
    
    return {"message": f"Job {approval.approval_status}"}

@api_router.post("/jobs/{job_id}/renew")
async def renew_job(request: Request, job_id: str):
    """Renew an expired job for another 15 days"""
    user = await require_role(request, ["marka"])
    
    job_doc = await db.job_posts.find_one({"job_id": job_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    
    now = datetime.now(timezone.utc)
    new_expires_at = now + timedelta(days=15)
    
    await db.job_posts.update_one(
        {"job_id": job_id},
        {"$set": {
            "status": "open",
            "expires_at": new_expires_at,
            "approval_status": "pending"  # Needs re-approval
        }}
    )
    
    # Notify admins
    admins = await db.users.find({"user_type": "admin"}, {"_id": 0, "user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            user_id=admin["user_id"],
            type="update",
            title="İlan Yenilendi - Onay Bekliyor",
            message=f"{user.name} ilanı yeniledi: {job_doc['title']}",
            link="/admin#jobs"
        )
    
    return {"message": "Job renewed for 15 days, pending approval"}

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
    
    # Create notification for brand
    await create_notification(
        user_id=job_doc["brand_user_id"],
        type="application",
        title="Yeni Başvuru!",
        message=f"{user.name} iş ilanınıza başvurdu: {job_doc['title']}",
        link="/brand#jobs"
    )
    
    # Send email notification to brand
    brand_user = await db.users.find_one({"user_id": job_doc["brand_user_id"]}, {"_id": 0})
    if brand_user and brand_user.get("email"):
        html_content = get_notification_email_html(
            title="Yeni Başvuru Aldınız! 🎉",
            message=f"<strong>{user.name}</strong> adlı influencer, <strong>{job_doc['title']}</strong> ilanınıza başvurdu.<br><br>Başvuru mesajı: <em>\"{app_data.message[:200]}...\"</em> " if len(app_data.message) > 200 else f"<strong>{user.name}</strong> adlı influencer, <strong>{job_doc['title']}</strong> ilanınıza başvurdu.<br><br>Başvuru mesajı: <em>\"{app_data.message}\"</em>",
            action_link=f"{FRONTEND_URL}/brand",
            action_text="Başvuruları Görüntüle"
        )
        await send_email(
            to_email=brand_user["email"],
            subject=f"Yeni Başvuru: {job_doc['title']} - FLULANCE",
            html_content=html_content
        )
    
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
    
    # Create notification for influencer
    await create_notification(
        user_id=app_doc["influencer_user_id"],
        type="match",
        title="Başvurunuz Kabul Edildi!",
        message=f"{user.name} başvurunuzu kabul etti: {job_doc['title']}",
        link="/influencer#matches"
    )
    
    # Send email notification to influencer
    influencer_user = await db.users.find_one({"user_id": app_doc["influencer_user_id"]}, {"_id": 0})
    if influencer_user and influencer_user.get("email"):
        html_content = get_notification_email_html(
            title="Başvurunuz Kabul Edildi! 🎉",
            message=f"Tebrikler! <strong>{user.name}</strong>, <strong>{job_doc['title']}</strong> ilanına yaptığınız başvuruyu kabul etti.<br><br>Artık sohbet edebilir ve işbirliğinize başlayabilirsiniz!",
            action_link=f"{FRONTEND_URL}/influencer",
            action_text="Sohbete Başla"
        )
        await send_email(
            to_email=influencer_user["email"],
            subject=f"Başvurunuz Kabul Edildi: {job_doc['title']} - FLULANCE",
            html_content=html_content
        )
    
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

@api_router.put("/matches/{match_id}/complete")
async def complete_match(request: Request, match_id: str):
    """Mark a match/job as completed"""
    user = await require_auth(request)
    
    match_doc = await db.matches.find_one({"match_id": match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is part of this match
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    # Only active matches can be completed
    if match_doc.get("status") != "active":
        raise HTTPException(status_code=400, detail="Only active matches can be completed")
    
    # Update match status
    await db.matches.update_one(
        {"match_id": match_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "completed_by": user.user_id
        }}
    )
    
    # Update job status to filled if brand completes
    if user.user_type == "marka":
        await db.job_posts.update_one(
            {"job_id": match_doc["job_id"]},
            {"$set": {"status": "filled"}}
        )
    
    # Notify the other party
    other_user_id = match_doc["influencer_user_id"] if user.user_type == "marka" else match_doc["brand_user_id"]
    await create_notification(
        user_id=other_user_id,
        type="match",
        title="İş Tamamlandı! ✅",
        message=f"'{match_doc['job_title']}' işi tamamlandı olarak işaretlendi.",
        link="/home"
    )
    
    return {"message": "Match completed successfully"}

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
    
    # Mark messages as read if they're not from the current user
    await db.messages.update_many(
        {
            "match_id": match_id,
            "sender_user_id": {"$ne": user.user_id},
            "is_read": {"$ne": True}
        },
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
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

# ============= NOTIFICATION ROUTES =============

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(request: Request):
    user = await require_auth(request)
    
    notifications = await db.notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return [Notification(**n) for n in notifications]

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    user = await require_auth(request)
    
    count = await db.notifications.count_documents({
        "user_id": user.user_id,
        "is_read": False
    })
    
    return {"count": count}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(request: Request, notification_id: str):
    user = await require_auth(request)
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user.user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}

@api_router.post("/notifications/mark-all-read")
async def mark_all_read(request: Request):
    user = await require_auth(request)
    
    await db.notifications.update_many(
        {"user_id": user.user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}

# ============= ANNOUNCEMENT ROUTES =============

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements():
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return [Announcement(**a) for a in announcements]

@api_router.get("/announcements/pinned", response_model=List[Announcement])
async def get_pinned_announcements():
    """Ana sayfada gösterilecek pinned duyurular"""
    announcements = await db.announcements.find({"is_pinned": True}, {"_id": 0}).sort("created_at", -1).limit(3).to_list(3)
    return [Announcement(**a) for a in announcements]

@api_router.post("/admin/announcements", response_model=Announcement)
async def create_announcement(request: Request, announcement_data: AnnouncementCreate):
    await require_role(request, ["admin"])
    
    announcement_id = f"announcement_{uuid.uuid4().hex[:12]}"
    
    announcement_doc = {
        "announcement_id": announcement_id,
        **announcement_data.model_dump(),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.announcements.insert_one(announcement_doc)
    
    announcement_doc.pop("_id")
    return Announcement(**announcement_doc)

@api_router.put("/admin/announcements/{announcement_id}", response_model=Announcement)
async def update_announcement(request: Request, announcement_id: str, announcement_data: AnnouncementCreate):
    await require_role(request, ["admin"])
    
    announcement_doc = {
        **announcement_data.model_dump(),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.announcements.update_one(
        {"announcement_id": announcement_id},
        {"$set": announcement_doc}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    updated = await db.announcements.find_one({"announcement_id": announcement_id}, {"_id": 0})
    return Announcement(**updated)

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(request: Request, announcement_id: str):
    await require_role(request, ["admin"])
    
    result = await db.announcements.delete_one({"announcement_id": announcement_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return {"message": "Announcement deleted"}

# ============= FAVORITE ROUTES =============

@api_router.post("/favorites/{job_id}")
async def add_favorite(request: Request, job_id: str):
    user = await require_auth(request)
    
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")
    
    favorite_id = f"fav_{uuid.uuid4().hex[:12]}"
    
    favorite_doc = {
        "favorite_id": favorite_id,
        "user_id": user.user_id,
        "job_id": job_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.favorites.insert_one(favorite_doc)
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{job_id}")
async def remove_favorite(request: Request, job_id: str):
    user = await require_auth(request)
    
    result = await db.favorites.delete_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def get_favorites(request: Request):
    user = await require_auth(request)
    
    favorites = await db.favorites.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get job details for each favorite
    job_ids = [fav["job_id"] for fav in favorites]
    jobs = await db.job_posts.find({"job_id": {"$in": job_ids}}, {"_id": 0}).to_list(100)
    
    return jobs

@api_router.get("/favorites/check/{job_id}")
async def check_favorite(request: Request, job_id: str):
    user = await require_auth(request)
    
    favorite = await db.favorites.find_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    
    return {"is_favorite": favorite is not None}

# ============= TRENDING & RECOMMENDATIONS =============

@api_router.get("/trending/categories")
async def get_trending_categories():
    # Aggregate jobs by category
    pipeline = [
        {"$match": {"status": "open"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 6}
    ]
    
    results = await db.job_posts.aggregate(pipeline).to_list(6)
    
    return [{"category": r["_id"], "count": r["count"]} for r in results]

@api_router.get("/recommendations")
async def get_recommendations(request: Request):
    user = await require_auth(request)
    
    if user.user_type == "influencer":
        # Get influencer's specialties
        profile = await db.influencer_profiles.find_one({"user_id": user.user_id})
        
        if profile and profile.get("specialties"):
            # Find jobs matching specialties
            jobs = await db.job_posts.find({
                "status": "open",
                "category": {"$in": profile["specialties"]}
            }, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
            
            return jobs
    
    # Default: return recent jobs
    jobs = await db.job_posts.find({"status": "open"}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    return jobs

# ============= PUBLIC ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "FLULANCE API", "status": "active"}

# ============= REVIEW ROUTES (FAZ 2) =============

@api_router.post("/reviews", response_model=Review)
async def create_review(request: Request, review_data: ReviewCreate):
    user = await require_auth(request)
    
    # Rating validation
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Get match
    match_doc = await db.matches.find_one({"match_id": review_data.match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is part of this match
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    # Determine reviewed user
    if user.user_id == match_doc["brand_user_id"]:
        reviewed_user_id = match_doc["influencer_user_id"]
        reviewed_name = match_doc["influencer_name"]
        review_type = "brand_to_influencer"
    else:
        reviewed_user_id = match_doc["brand_user_id"]
        reviewed_name = match_doc["brand_name"]
        review_type = "influencer_to_brand"
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "match_id": review_data.match_id,
        "reviewer_user_id": user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this match")
    
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    
    review_doc = {
        "review_id": review_id,
        "match_id": review_data.match_id,
        "reviewer_user_id": user.user_id,
        "reviewer_name": user.name,
        "reviewed_user_id": reviewed_user_id,
        "reviewed_name": reviewed_name,
        "rating": review_data.rating,
        "comment": review_data.comment,
        "review_type": review_type,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update influencer stats if reviewed is influencer
    if review_type == "brand_to_influencer":
        await update_influencer_rating(reviewed_user_id)
    
    # Create notification
    await create_notification(
        user_id=reviewed_user_id,
        type="review",
        title="Yeni Değerlendirme!",
        message=f"{user.name} sizi değerlendirdi: {review_data.rating} yıldız",
        link="/reviews"
    )
    
    review_doc.pop("_id", None)
    return Review(**review_doc)

async def update_influencer_rating(user_id: str):
    """Update influencer's average rating and total reviews"""
    pipeline = [
        {"$match": {"reviewed_user_id": user_id, "review_type": "brand_to_influencer"}},
        {"$group": {
            "_id": "$reviewed_user_id",
            "average_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    
    results = await db.reviews.aggregate(pipeline).to_list(1)
    
    if results:
        await db.influencer_stats.update_one(
            {"user_id": user_id},
            {"$set": {
                "average_rating": round(results[0]["average_rating"], 1),
                "total_reviews": results[0]["total_reviews"],
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

@api_router.get("/reviews/user/{user_id}", response_model=List[Review])
async def get_user_reviews(user_id: str):
    """Get all reviews for a user"""
    reviews = await db.reviews.find(
        {"reviewed_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [Review(**r) for r in reviews]

@api_router.get("/reviews/my-reviews", response_model=List[Review])
async def get_my_reviews(request: Request):
    """Get reviews about me"""
    user = await require_auth(request)
    
    reviews = await db.reviews.find(
        {"reviewed_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [Review(**r) for r in reviews]

@api_router.get("/reviews/given", response_model=List[Review])
async def get_given_reviews(request: Request):
    """Get reviews I've given"""
    user = await require_auth(request)
    
    reviews = await db.reviews.find(
        {"reviewer_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [Review(**r) for r in reviews]

@api_router.get("/reviews/match/{match_id}")
async def get_match_reviews(request: Request, match_id: str):
    """Get reviews for a specific match"""
    user = await require_auth(request)
    
    # Verify access
    match_doc = await db.matches.find_one({"match_id": match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    reviews = await db.reviews.find({"match_id": match_id}, {"_id": 0}).to_list(10)
    
    # Check if current user has reviewed
    user_reviewed = any(r["reviewer_user_id"] == user.user_id for r in reviews)
    
    return {
        "reviews": [Review(**r) for r in reviews],
        "user_has_reviewed": user_reviewed
    }

# ============= INFLUENCER STATS ROUTES (FAZ 2) =============

@api_router.post("/influencer-stats", response_model=InfluencerStats)
async def create_update_stats(request: Request, stats_data: InfluencerStatsCreate):
    user = await require_role(request, ["influencer"])
    
    # Check if stats exist
    existing = await db.influencer_stats.find_one({"user_id": user.user_id})
    
    stats_id = existing["stats_id"] if existing else f"stats_{uuid.uuid4().hex[:12]}"
    
    # Calculate total reach
    total_reach = 0
    if stats_data.instagram_followers:
        total_reach += stats_data.instagram_followers
    if stats_data.tiktok_followers:
        total_reach += stats_data.tiktok_followers
    if stats_data.youtube_subscribers:
        total_reach += stats_data.youtube_subscribers
    if stats_data.twitter_followers:
        total_reach += stats_data.twitter_followers
    
    stats_doc = {
        "stats_id": stats_id,
        "user_id": user.user_id,
        **stats_data.model_dump(),
        "total_reach": total_reach,
        "completed_jobs": existing.get("completed_jobs", 0) if existing else 0,
        "average_rating": existing.get("average_rating", 0.0) if existing else 0.0,
        "total_reviews": existing.get("total_reviews", 0) if existing else 0,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if existing:
        await db.influencer_stats.update_one(
            {"user_id": user.user_id},
            {"$set": stats_doc}
        )
    else:
        await db.influencer_stats.insert_one(stats_doc)
    
    stats_doc.pop("_id", None)
    return InfluencerStats(**stats_doc)

@api_router.get("/influencer-stats/me", response_model=Optional[InfluencerStats])
async def get_my_stats(request: Request):
    user = await require_role(request, ["influencer"])
    
    stats_doc = await db.influencer_stats.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not stats_doc:
        return None
    
    return InfluencerStats(**stats_doc)

@api_router.get("/influencer-stats/top-influencers")
async def get_top_influencers():
    """Get top influencers by rating and reach"""
    pipeline = [
        {"$match": {"total_reach": {"$gt": 0}}},
        {"$sort": {"average_rating": -1, "total_reach": -1}},
        {"$limit": 10}
    ]
    
    stats = await db.influencer_stats.aggregate(pipeline).to_list(10)
    
    # Get user info for each
    result = []
    for stat in stats:
        user_doc = await db.users.find_one({"user_id": stat["user_id"]}, {"_id": 0, "password_hash": 0})
        profile_doc = await db.influencer_profiles.find_one({"user_id": stat["user_id"]}, {"_id": 0})
        
        if user_doc:
            result.append({
                "user": user_doc,
                "profile": profile_doc,
                "stats": {k: v for k, v in stat.items() if k != "_id"}
            })
    
    return result

@api_router.get("/influencer-stats/{user_id}", response_model=Optional[InfluencerStats])
async def get_influencer_stats(user_id: str):
    """Public endpoint to get influencer stats"""
    stats_doc = await db.influencer_stats.find_one({"user_id": user_id}, {"_id": 0})
    
    if not stats_doc:
        return None
    
    return InfluencerStats(**stats_doc)

# ============= BADGE/VERIFICATION ROUTES (FAZ 2) =============

@api_router.post("/admin/badges/{user_id}")
async def award_badge(request: Request, user_id: str, badge_data: BadgeRequest):
    admin = await require_role(request, ["admin"])
    
    # Validate badge type
    valid_badges = ["verified", "top", "rising", "new"]
    if badge_data.badge_type not in valid_badges:
        raise HTTPException(status_code=400, detail=f"Invalid badge type. Must be one of: {valid_badges}")
    
    # Check if user exists
    user_doc = await db.users.find_one({"user_id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user badge
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"badge": badge_data.badge_type}}
    )
    
    # Store badge record
    badge_id = f"badge_{uuid.uuid4().hex[:12]}"
    badge_doc = {
        "badge_id": badge_id,
        "user_id": user_id,
        "badge_type": badge_data.badge_type,
        "awarded_at": datetime.now(timezone.utc),
        "awarded_by": admin.user_id,
        "reason": badge_data.reason
    }
    
    await db.badges.insert_one(badge_doc)
    
    # Create notification
    badge_names = {
        "verified": "Doğrulanmış ✓",
        "top": "Top Influencer ⭐",
        "rising": "Yükselen Yıldız 🚀",
        "new": "Yeni Üye 🆕"
    }
    
    await create_notification(
        user_id=user_id,
        type="badge",
        title="Yeni Rozet Kazandınız!",
        message=f"Tebrikler! {badge_names.get(badge_data.badge_type, badge_data.badge_type)} rozetini kazandınız!",
        link="/profile"
    )
    
    return {"message": f"Badge '{badge_data.badge_type}' awarded to user"}

@api_router.delete("/admin/badges/{user_id}")
async def remove_badge(request: Request, user_id: str):
    await require_role(request, ["admin"])
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"badge": None}}
    )
    
    return {"message": "Badge removed"}

@api_router.get("/admin/badges")
async def get_all_badges(request: Request):
    await require_role(request, ["admin"])
    
    badges = await db.badges.find({}, {"_id": 0}).sort("awarded_at", -1).to_list(100)
    
    # Get user names
    result = []
    for badge in badges:
        user_doc = await db.users.find_one({"user_id": badge["user_id"]}, {"_id": 0, "password_hash": 0})
        if user_doc:
            badge["user_name"] = user_doc.get("name", "Unknown")
            result.append(badge)
    
    return result

@api_router.get("/badges/user/{user_id}")
async def get_user_badges(user_id: str):
    """Get all badges for a user"""
    badges = await db.badges.find({"user_id": user_id}, {"_id": 0}).sort("awarded_at", -1).to_list(10)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    current_badge = user_doc.get("badge") if user_doc else None
    
    return {
        "current_badge": current_badge,
        "badge_history": badges
    }

# ============= ADMIN CONTENT MANAGEMENT ROUTES =============

@api_router.get("/admin/dashboard-stats")
async def get_dashboard_stats(request: Request):
    """Get detailed dashboard statistics for admin"""
    await require_role(request, ["admin"])
    
    # User stats
    total_users = await db.users.count_documents({})
    brands = await db.users.count_documents({"user_type": "marka"})
    influencers = await db.users.count_documents({"user_type": "influencer"})
    
    # Get users by date for chart
    from datetime import timedelta
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=30)
    
    user_growth = []
    for i in range(30):
        day = start_date + timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = await db.users.count_documents({
            "created_at": {"$gte": day, "$lt": next_day}
        })
        user_growth.append({
            "date": day.strftime("%Y-%m-%d"),
            "count": count
        })
    
    # Job stats
    total_jobs = await db.job_posts.count_documents({})
    open_jobs = await db.job_posts.count_documents({"status": "open"})
    pending_jobs = await db.job_posts.count_documents({"approval_status": "pending"})
    approved_jobs = await db.job_posts.count_documents({"approval_status": "approved"})
    
    # Match stats
    total_matches = await db.matches.count_documents({})
    active_matches = await db.matches.count_documents({"status": "active"})
    completed_matches = await db.matches.count_documents({"status": "completed"})
    
    # Application stats
    total_applications = await db.applications.count_documents({})
    pending_applications = await db.applications.count_documents({"status": "pending"})
    accepted_applications = await db.applications.count_documents({"status": "accepted"})
    
    # Category distribution
    categories = await db.job_posts.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "users": {
            "total": total_users,
            "brands": brands,
            "influencers": influencers,
            "growth": user_growth
        },
        "jobs": {
            "total": total_jobs,
            "open": open_jobs,
            "pending": pending_jobs,
            "approved": approved_jobs
        },
        "matches": {
            "total": total_matches,
            "active": active_matches,
            "completed": completed_matches
        },
        "applications": {
            "total": total_applications,
            "pending": pending_applications,
            "accepted": accepted_applications
        },
        "categories": [{"name": c["_id"] or "Diğer", "count": c["count"]} for c in categories]
    }

@api_router.get("/admin/activity-logs")
async def get_activity_logs(request: Request, limit: int = 50, skip: int = 0):
    """Get recent activity logs"""
    await require_role(request, ["admin"])
    
    logs = await db.activity_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return logs

@api_router.post("/admin/activity-logs")
async def create_activity_log(user_id: str, action: str, details: str = "", target_type: str = "", target_id: str = ""):
    """Create an activity log entry (internal use)"""
    log_doc = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "action": action,
        "details": details,
        "target_type": target_type,
        "target_id": target_id,
        "timestamp": datetime.now(timezone.utc)
    }
    await db.activity_logs.insert_one(log_doc)
    return log_doc

# Popup Settings
@api_router.get("/admin/popup-settings")
async def get_popup_settings(request: Request):
    """Get popup notification settings"""
    await require_role(request, ["admin"])
    
    settings = await db.popup_settings.find_one({"type": "homepage"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "homepage",
            "enabled": False,
            "title": "Hoş Geldiniz!",
            "content": "FLULANCE'a hoş geldiniz!",
            "button_text": "Anladım",
            "button_link": "",
            "show_once": True
        }
    return settings

@api_router.put("/admin/popup-settings")
async def update_popup_settings(request: Request, settings: dict):
    """Update popup notification settings"""
    await require_role(request, ["admin"])
    
    settings["type"] = "homepage"
    settings["updated_at"] = datetime.now(timezone.utc)
    
    await db.popup_settings.update_one(
        {"type": "homepage"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Popup settings updated"}

@api_router.get("/popup-settings")
async def get_public_popup_settings():
    """Get popup settings for public display"""
    settings = await db.popup_settings.find_one({"type": "homepage", "enabled": True}, {"_id": 0})
    return settings or {"enabled": False}

# Blog/Success Stories Management
@api_router.get("/admin/content/{content_type}")
async def get_admin_content(request: Request, content_type: str):
    """Get content by type (blog, success_stories, events, faq)"""
    await require_role(request, ["admin"])
    
    content = await db.admin_content.find(
        {"content_type": content_type},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return content

@api_router.post("/admin/content")
async def create_admin_content(request: Request, content: dict):
    """Create new content (blog, success_story, event, faq)"""
    await require_role(request, ["admin"])
    
    content_doc = {
        "content_id": f"content_{uuid.uuid4().hex[:12]}",
        "content_type": content.get("content_type", "blog"),
        "title": content.get("title", ""),
        "content": content.get("content", ""),
        "summary": content.get("summary", ""),
        "image_url": content.get("image_url", ""),
        "author": content.get("author", "FLULANCE"),
        "is_published": content.get("is_published", False),
        "is_featured": content.get("is_featured", False),
        "tags": content.get("tags", []),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # For FAQ
    if content.get("content_type") == "faq":
        content_doc["question"] = content.get("question", "")
        content_doc["answer"] = content.get("answer", "")
        content_doc["category"] = content.get("category", "Genel")
        content_doc["order"] = content.get("order", 0)
    
    # For Events
    if content.get("content_type") == "event":
        content_doc["event_date"] = content.get("event_date")
        content_doc["event_link"] = content.get("event_link", "")
        content_doc["event_type"] = content.get("event_type", "webinar")
    
    await db.admin_content.insert_one(content_doc)
    content_doc.pop("_id", None)
    
    return content_doc

@api_router.put("/admin/content/{content_id}")
async def update_admin_content(request: Request, content_id: str, content: dict):
    """Update existing content"""
    await require_role(request, ["admin"])
    
    content["updated_at"] = datetime.now(timezone.utc)
    content.pop("content_id", None)
    content.pop("_id", None)
    
    result = await db.admin_content.update_one(
        {"content_id": content_id},
        {"$set": content}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return {"message": "Content updated"}

@api_router.delete("/admin/content/{content_id}")
async def delete_admin_content(request: Request, content_id: str):
    """Delete content"""
    await require_role(request, ["admin"])
    
    result = await db.admin_content.delete_one({"content_id": content_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return {"message": "Content deleted"}

# Public content endpoints
@api_router.get("/content/{content_type}")
async def get_public_content(content_type: str, limit: int = 10):
    """Get published content by type"""
    content = await db.admin_content.find(
        {"content_type": content_type, "is_published": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return content

@api_router.get("/content/{content_type}/featured")
async def get_featured_content(content_type: str, limit: int = 5):
    """Get featured content by type"""
    content = await db.admin_content.find(
        {"content_type": content_type, "is_published": True, "is_featured": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return content

# ============= ETAP 5: BRIEF (TERSİNE İLAN) ROUTES =============

@api_router.post("/briefs", response_model=Brief)
async def create_brief(request: Request, brief_data: BriefCreate):
    """Create a new brief (reverse job posting) - Brand only"""
    user = await require_role(request, ["marka"])
    
    brief_doc = {
        "brief_id": f"brief_{uuid.uuid4().hex[:12]}",
        "brand_user_id": user.user_id,
        "brand_name": user.name,
        "title": brief_data.title,
        "description": brief_data.description,
        "category": brief_data.category,
        "budget_min": brief_data.budget_min,
        "budget_max": brief_data.budget_max,
        "platforms": brief_data.platforms,
        "deadline": brief_data.deadline,
        "requirements": brief_data.requirements,
        "status": "open",
        "proposal_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.briefs.insert_one(brief_doc)
    brief_doc.pop("_id", None)
    
    # Send notification to matching influencers with category alerts
    alerts = await db.category_alerts.find({
        "category": brief_data.category,
        "$or": [
            {"budget_min": {"$lte": brief_data.budget_max}},
            {"budget_min": None}
        ]
    }).to_list(100)
    
    for alert in alerts:
        await create_notification(
            user_id=alert["user_id"],
            type="brief",
            title="Yeni Brief! 📋",
            message=f"'{brief_data.title}' - İlginizi çekebilecek yeni bir brief yayınlandı.",
            link="/briefs"
        )
    
    return Brief(**brief_doc)

@api_router.get("/briefs")
async def get_briefs(
    request: Request,
    status: str = "open",
    category: Optional[str] = None
):
    """Get all open briefs - for influencers"""
    user = await require_auth(request)
    
    query = {"status": status}
    if category:
        query["category"] = category
    
    briefs = await db.briefs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return briefs

@api_router.get("/briefs/my-briefs")
async def get_my_briefs(request: Request):
    """Get brand's own briefs"""
    user = await require_role(request, ["marka"])
    
    briefs = await db.briefs.find(
        {"brand_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return briefs

@api_router.get("/briefs/{brief_id}")
async def get_brief(request: Request, brief_id: str):
    """Get a specific brief with proposals"""
    user = await require_auth(request)
    
    brief = await db.briefs.find_one({"brief_id": brief_id}, {"_id": 0})
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")
    
    # Get proposals if brand is viewing their own brief
    proposals = []
    if user.user_type == "marka" and brief["brand_user_id"] == user.user_id:
        proposals = await db.proposals.find(
            {"brief_id": brief_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
    
    return {"brief": brief, "proposals": proposals}

@api_router.post("/briefs/{brief_id}/proposals")
async def create_proposal(request: Request, brief_id: str, proposal_data: ProposalCreate):
    """Submit a proposal for a brief - Influencer only"""
    user = await require_role(request, ["influencer"])
    
    # Check brief exists and is open
    brief = await db.briefs.find_one({"brief_id": brief_id})
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")
    if brief["status"] != "open":
        raise HTTPException(status_code=400, detail="Brief is not accepting proposals")
    
    # Check if already submitted
    existing = await db.proposals.find_one({
        "brief_id": brief_id,
        "influencer_user_id": user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted a proposal")
    
    proposal_doc = {
        "proposal_id": f"prop_{uuid.uuid4().hex[:12]}",
        "brief_id": brief_id,
        "influencer_user_id": user.user_id,
        "influencer_name": user.name,
        "proposed_price": proposal_data.proposed_price,
        "message": proposal_data.message,
        "delivery_time": proposal_data.delivery_time,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.proposals.insert_one(proposal_doc)
    
    # Update proposal count
    await db.briefs.update_one(
        {"brief_id": brief_id},
        {"$inc": {"proposal_count": 1}}
    )
    
    # Notify brand
    await create_notification(
        user_id=brief["brand_user_id"],
        type="proposal",
        title="Yeni Teklif! 💰",
        message=f"{user.name} brief'inize teklif gönderdi: {proposal_data.proposed_price}₺",
        link=f"/briefs/{brief_id}"
    )
    
    proposal_doc.pop("_id", None)
    return proposal_doc

@api_router.put("/briefs/{brief_id}/proposals/{proposal_id}/accept")
async def accept_proposal(request: Request, brief_id: str, proposal_id: str):
    """Accept a proposal and create a match"""
    user = await require_role(request, ["marka"])
    
    # Verify ownership
    brief = await db.briefs.find_one({"brief_id": brief_id})
    if not brief or brief["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your brief")
    
    proposal = await db.proposals.find_one({"proposal_id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Update proposal status
    await db.proposals.update_one(
        {"proposal_id": proposal_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Reject other proposals
    await db.proposals.update_many(
        {"brief_id": brief_id, "proposal_id": {"$ne": proposal_id}},
        {"$set": {"status": "rejected"}}
    )
    
    # Close the brief
    await db.briefs.update_one(
        {"brief_id": brief_id},
        {"$set": {"status": "closed"}}
    )
    
    # Create a match
    match_doc = {
        "match_id": f"match_{uuid.uuid4().hex[:12]}",
        "job_id": brief_id,  # Using brief_id as job reference
        "job_title": brief["title"],
        "brand_user_id": user.user_id,
        "brand_name": user.name,
        "influencer_user_id": proposal["influencer_user_id"],
        "influencer_name": proposal["influencer_name"],
        "agreed_price": proposal["proposed_price"],
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.matches.insert_one(match_doc)
    
    # Notify influencer
    await create_notification(
        user_id=proposal["influencer_user_id"],
        type="match",
        title="Teklifiniz Kabul Edildi! 🎉",
        message=f"{user.name} teklifinizi kabul etti: {brief['title']}",
        link="/influencer#matches"
    )
    
    return {"message": "Proposal accepted, match created"}

# ============= ETAP 5: PORTFOLIO ROUTES =============

@api_router.get("/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    """Get user's portfolio - public"""
    items = await db.portfolio_items.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Get user info
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    profile = await db.influencer_profiles.find_one({"user_id": user_id}, {"_id": 0})
    stats = await db.influencer_stats.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user,
        "profile": profile,
        "stats": stats,
        "portfolio": items
    }

@api_router.post("/portfolio")
async def add_portfolio_item(request: Request, item: dict):
    """Add a portfolio item"""
    user = await require_role(request, ["influencer"])
    
    item_doc = {
        "item_id": f"port_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "title": item.get("title", ""),
        "description": item.get("description", ""),
        "category": item.get("category", ""),
        "image_url": item.get("image_url", ""),
        "video_url": item.get("video_url", ""),
        "link": item.get("link", ""),
        "brand_name": item.get("brand_name", ""),
        "completion_date": item.get("completion_date", ""),
        "metrics": item.get("metrics", {}),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.portfolio_items.insert_one(item_doc)
    item_doc.pop("_id", None)
    
    return item_doc

@api_router.put("/portfolio/{item_id}")
async def update_portfolio_item(request: Request, item_id: str, item: dict):
    """Update a portfolio item"""
    user = await require_role(request, ["influencer"])
    
    existing = await db.portfolio_items.find_one({"item_id": item_id})
    if not existing or existing["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your portfolio item")
    
    item.pop("item_id", None)
    item.pop("user_id", None)
    item.pop("_id", None)
    
    await db.portfolio_items.update_one(
        {"item_id": item_id},
        {"$set": item}
    )
    
    return {"message": "Portfolio item updated"}

@api_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(request: Request, item_id: str):
    """Delete a portfolio item"""
    user = await require_role(request, ["influencer"])
    
    result = await db.portfolio_items.delete_one({
        "item_id": item_id,
        "user_id": user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or not yours")
    
    return {"message": "Portfolio item deleted"}

# ============= ETAP 5: SOCIAL MEDIA ACCOUNTS =============

@api_router.get("/social-accounts")
async def get_social_accounts(request: Request):
    """Get user's linked social media accounts"""
    user = await require_auth(request)
    
    accounts = await db.social_accounts.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(10)
    
    return accounts

@api_router.post("/social-accounts")
async def add_social_account(request: Request, account: dict):
    """Add or update a social media account"""
    user = await require_auth(request)
    
    platform = account.get("platform", "").lower()
    if platform not in ["instagram", "tiktok", "youtube", "twitter", "linkedin", "facebook"]:
        raise HTTPException(status_code=400, detail="Invalid platform")
    
    account_doc = {
        "user_id": user.user_id,
        "platform": platform,
        "username": account.get("username", ""),
        "followers": int(account.get("followers", 0)),
        "profile_url": account.get("profile_url", ""),
        "verified": False,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Upsert
    await db.social_accounts.update_one(
        {"user_id": user.user_id, "platform": platform},
        {"$set": account_doc},
        upsert=True
    )
    
    # Update influencer stats if influencer
    if user.user_type == "influencer":
        stats_update = {}
        if platform == "instagram":
            stats_update["instagram_followers"] = account_doc["followers"]
        elif platform == "youtube":
            stats_update["youtube_subscribers"] = account_doc["followers"]
        elif platform == "tiktok":
            stats_update["tiktok_followers"] = account_doc["followers"]
        elif platform == "twitter":
            stats_update["twitter_followers"] = account_doc["followers"]
        
        if stats_update:
            await db.influencer_stats.update_one(
                {"user_id": user.user_id},
                {"$set": stats_update},
                upsert=True
            )
    
    return {"message": "Social account updated"}

@api_router.delete("/social-accounts/{platform}")
async def remove_social_account(request: Request, platform: str):
    """Remove a social media account"""
    user = await require_auth(request)
    
    result = await db.social_accounts.delete_one({
        "user_id": user.user_id,
        "platform": platform.lower()
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"message": "Social account removed"}

# ============= ETAP 5: CATEGORY ALERTS =============

@api_router.get("/category-alerts")
async def get_category_alerts(request: Request):
    """Get user's category alerts"""
    user = await require_auth(request)
    
    alerts = await db.category_alerts.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(20)
    
    return alerts

@api_router.post("/category-alerts")
async def create_category_alert(request: Request, alert: dict):
    """Create a category alert"""
    user = await require_auth(request)
    
    # Check limit
    count = await db.category_alerts.count_documents({"user_id": user.user_id})
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 alerts allowed")
    
    alert_doc = {
        "alert_id": f"alert_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "category": alert.get("category", ""),
        "platforms": alert.get("platforms", []),
        "budget_min": alert.get("budget_min"),
        "budget_max": alert.get("budget_max"),
        "email_notification": alert.get("email_notification", True),
        "push_notification": alert.get("push_notification", False),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.category_alerts.insert_one(alert_doc)
    alert_doc.pop("_id", None)
    
    return alert_doc

@api_router.delete("/category-alerts/{alert_id}")
async def delete_category_alert(request: Request, alert_id: str):
    """Delete a category alert"""
    user = await require_auth(request)
    
    result = await db.category_alerts.delete_one({
        "alert_id": alert_id,
        "user_id": user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert deleted"}

# ============= ETAP 5: IDENTITY VERIFICATION =============

@api_router.post("/identity-verification")
async def submit_identity_verification(request: Request, data: dict):
    """Submit identity verification (TC/Vergi No)"""
    user = await require_auth(request)
    
    verification_type = data.get("verification_type", "tc_kimlik")
    if verification_type not in ["tc_kimlik", "vergi_no"]:
        raise HTTPException(status_code=400, detail="Invalid verification type")
    
    # Check if already pending or approved
    existing = await db.identity_verifications.find_one({
        "user_id": user.user_id,
        "status": {"$in": ["pending", "approved"]}
    })
    if existing:
        if existing["status"] == "approved":
            raise HTTPException(status_code=400, detail="Already verified")
        raise HTTPException(status_code=400, detail="Verification already pending")
    
    # Hash the document number for privacy
    import hashlib
    doc_number = data.get("document_number", "")
    hashed_doc = hashlib.sha256(doc_number.encode()).hexdigest()
    
    verification_doc = {
        "verification_id": f"verify_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "verification_type": verification_type,
        "document_number": hashed_doc,
        "full_name": data.get("full_name", ""),
        "consent_given": data.get("consent_given", False),  # User acknowledges voluntary submission
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc),
        "reviewed_at": None,
        "reviewed_by": None
    }
    
    if not verification_doc["consent_given"]:
        raise HTTPException(status_code=400, detail="Consent required for verification")
    
    await db.identity_verifications.insert_one(verification_doc)
    
    # Update user badge to show pending verification
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"verification_status": "pending"}}
    )
    
    return {"message": "Verification submitted, pending review"}

@api_router.get("/identity-verification/status")
async def get_verification_status(request: Request):
    """Get user's verification status"""
    user = await require_auth(request)
    
    verification = await db.identity_verifications.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "document_number": 0}  # Don't return hashed document
    )
    
    if not verification:
        return {"status": "not_submitted"}
    
    return verification

@api_router.get("/admin/identity-verifications")
async def admin_get_verifications(request: Request, status: str = "pending"):
    """Admin: Get all pending verifications"""
    await require_role(request, ["admin"])
    
    verifications = await db.identity_verifications.find(
        {"status": status},
        {"_id": 0, "document_number": 0}
    ).sort("submitted_at", -1).to_list(100)
    
    # Get user info for each
    for v in verifications:
        user = await db.users.find_one({"user_id": v["user_id"]}, {"_id": 0, "password_hash": 0})
        v["user"] = user
    
    return verifications

@api_router.put("/admin/identity-verifications/{verification_id}")
async def admin_review_verification(request: Request, verification_id: str, data: dict):
    """Admin: Approve or reject verification"""
    admin = await require_role(request, ["admin"])
    
    status = data.get("status")
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    verification = await db.identity_verifications.find_one({"verification_id": verification_id})
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    await db.identity_verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": status,
            "reviewed_at": datetime.now(timezone.utc),
            "reviewed_by": admin.user_id,
            "admin_notes": data.get("notes", "")
        }}
    )
    
    # Update user badge
    if status == "approved":
        await db.users.update_one(
            {"user_id": verification["user_id"]},
            {"$set": {
                "badge": "verified",
                "verification_status": "approved"
            }}
        )
        
        await create_notification(
            user_id=verification["user_id"],
            type="verification",
            title="Kimlik Doğrulandı! ✓",
            message="Kimlik doğrulamanız onaylandı. Artık 'Doğrulanmış' rozetine sahipsiniz.",
            link="/settings"
        )
    else:
        await db.users.update_one(
            {"user_id": verification["user_id"]},
            {"$set": {"verification_status": "rejected"}}
        )
        
        await create_notification(
            user_id=verification["user_id"],
            type="verification",
            title="Doğrulama Reddedildi",
            message=f"Kimlik doğrulamanız reddedildi. Sebep: {data.get('notes', 'Belirtilmedi')}",
            link="/settings"
        )
    
    return {"message": f"Verification {status}"}

# ============= ETAP 5: DISPUTE RESOLUTION =============

@api_router.post("/disputes")
async def create_dispute(request: Request, data: dict):
    """Create a dispute for a match"""
    user = await require_auth(request)
    
    match_id = data.get("match_id")
    match = await db.matches.find_one({"match_id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is part of this match
    if match["brand_user_id"] != user.user_id and match["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    # Check for existing open dispute
    existing = await db.disputes.find_one({
        "match_id": match_id,
        "status": {"$in": ["open", "under_review"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="An open dispute already exists for this match")
    
    # Determine reported user
    reported_user_id = match["influencer_user_id"] if user.user_id == match["brand_user_id"] else match["brand_user_id"]
    reported_name = match["influencer_name"] if user.user_id == match["brand_user_id"] else match["brand_name"]
    
    dispute_doc = {
        "dispute_id": f"dispute_{uuid.uuid4().hex[:12]}",
        "match_id": match_id,
        "reporter_user_id": user.user_id,
        "reporter_name": user.name,
        "reported_user_id": reported_user_id,
        "reported_name": reported_name,
        "reason": data.get("reason", ""),
        "description": data.get("description", ""),
        "evidence_urls": data.get("evidence_urls", []),
        "status": "open",
        "admin_notes": None,
        "resolution": None,
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None
    }
    
    await db.disputes.insert_one(dispute_doc)
    
    # Notify admin
    admins = await db.users.find({"user_type": "admin"}).to_list(10)
    for admin in admins:
        await create_notification(
            user_id=admin["user_id"],
            type="dispute",
            title="Yeni Anlaşmazlık! ⚠️",
            message=f"{user.name} bir anlaşmazlık bildirdi: {data.get('reason', '')}",
            link="/admin#disputes"
        )
    
    dispute_doc.pop("_id", None)
    return dispute_doc

@api_router.get("/disputes/my-disputes")
async def get_my_disputes(request: Request):
    """Get user's disputes"""
    user = await require_auth(request)
    
    disputes = await db.disputes.find(
        {"$or": [
            {"reporter_user_id": user.user_id},
            {"reported_user_id": user.user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return disputes

@api_router.get("/admin/disputes")
async def admin_get_disputes(request: Request, status: str = "open"):
    """Admin: Get all disputes"""
    await require_role(request, ["admin"])
    
    query = {} if status == "all" else {"status": status}
    
    disputes = await db.disputes.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return disputes

@api_router.put("/admin/disputes/{dispute_id}")
async def admin_resolve_dispute(request: Request, dispute_id: str, data: dict):
    """Admin: Update dispute status and resolution"""
    admin = await require_role(request, ["admin"])
    
    dispute = await db.disputes.find_one({"dispute_id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    update = {
        "status": data.get("status", dispute["status"]),
        "admin_notes": data.get("admin_notes", dispute.get("admin_notes")),
        "resolution": data.get("resolution", dispute.get("resolution"))
    }
    
    if data.get("status") == "resolved":
        update["resolved_at"] = datetime.now(timezone.utc)
    
    await db.disputes.update_one(
        {"dispute_id": dispute_id},
        {"$set": update}
    )
    
    # Notify both parties
    for user_id in [dispute["reporter_user_id"], dispute["reported_user_id"]]:
        await create_notification(
            user_id=user_id,
            type="dispute",
            title="Anlaşmazlık Güncellendi",
            message=f"Anlaşmazlık durumu: {data.get('status', dispute['status'])}",
            link="/settings"
        )
    
    return {"message": "Dispute updated"}

# ============= ADMIN: SOCIAL ACCOUNTS =============

@api_router.get("/admin/social-accounts")
async def admin_get_social_accounts(request: Request):
    """Admin: Get all pending social account verifications"""
    await require_role(request, ["admin"])
    
    # Get all unverified social accounts with user info
    pipeline = [
        {"$match": {"verified": {"$ne": True}}},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_info"
        }},
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "platform": 1,
            "username": 1,
            "followers": 1,
            "profile_url": 1,
            "verified": 1,
            "created_at": 1,
            "user_name": "$user_info.name"
        }}
    ]
    
    accounts = await db.social_accounts.aggregate(pipeline).to_list(100)
    return accounts

@api_router.put("/admin/social-accounts/{user_id}/{platform}")
async def admin_update_social_account(request: Request, user_id: str, platform: str):
    """Admin: Approve or reject social account"""
    admin_user = await require_role(request, ["admin"])
    
    data = await request.json()
    verified = data.get("verified", False)
    
    result = await db.social_accounts.update_one(
        {"user_id": user_id, "platform": platform},
        {"$set": {"verified": verified, "verified_at": datetime.now(timezone.utc) if verified else None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Social account not found")
    
    # Notify user
    await create_notification(
        user_id=user_id,
        type="social_verification",
        title="Sosyal Hesap Doğrulama",
        message=f"{platform.capitalize()} hesabınız {'onaylandı' if verified else 'reddedildi'}!",
        link="/social-accounts"
    )
    
    return {"message": f"Social account {'verified' if verified else 'rejected'}"}

# ============= ETAP 5: CONTRACT SIGNATURES =============

@api_router.post("/contracts/{contract_id}/sign")
async def sign_contract(request: Request, contract_id: str):
    """Sign a contract"""
    user = await require_auth(request)
    
    # Get contract
    contract = await db.contracts.find_one({"contract_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify user is part of this contract
    if contract["brand_user_id"] != user.user_id and contract["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    
    # Check if already signed
    existing = await db.contract_signatures.find_one({
        "contract_id": contract_id,
        "user_id": user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already signed")
    
    # Get IP and user agent
    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host
    user_agent = request.headers.get("user-agent", "Unknown")
    
    signature_doc = {
        "signature_id": f"sig_{uuid.uuid4().hex[:12]}",
        "contract_id": contract_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_type": user.user_type,
        "signed_at": datetime.now(timezone.utc),
        "ip_address": ip_address,
        "user_agent": user_agent[:500],  # Limit length
        "accepted_terms": True
    }
    
    await db.contract_signatures.insert_one(signature_doc)
    
    # Check if both parties signed
    signatures = await db.contract_signatures.find({"contract_id": contract_id}).to_list(2)
    
    if len(signatures) == 2:
        # Both signed - update contract status
        await db.contracts.update_one(
            {"contract_id": contract_id},
            {"$set": {"status": "signed", "signed_at": datetime.now(timezone.utc)}}
        )
        
        # Notify both parties
        for sig in signatures:
            await create_notification(
                user_id=sig["user_id"],
                type="contract",
                title="Sözleşme İmzalandı! ✍️",
                message="Her iki taraf da sözleşmeyi imzaladı. İşbirliği başlayabilir!",
                link="/contracts"
            )
    else:
        # Notify the other party
        other_user_id = contract["influencer_user_id"] if user.user_type == "marka" else contract["brand_user_id"]
        await create_notification(
            user_id=other_user_id,
            type="contract",
            title="Sözleşme İmza Bekliyor",
            message=f"{user.name} sözleşmeyi imzaladı. Sizin de imzalamanız bekleniyor.",
            link=f"/contracts/{contract_id}"
        )
    
    signature_doc.pop("_id", None)
    return signature_doc

@api_router.get("/contracts/{contract_id}/signatures")
async def get_contract_signatures(request: Request, contract_id: str):
    """Get signatures for a contract"""
    user = await require_auth(request)
    
    contract = await db.contracts.find_one({"contract_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify access
    if contract["brand_user_id"] != user.user_id and contract["influencer_user_id"] != user.user_id and user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    signatures = await db.contract_signatures.find(
        {"contract_id": contract_id},
        {"_id": 0}
    ).to_list(10)
    
    return signatures

# ============= INFLUENCER SEARCH ROUTES =============

@api_router.get("/influencers/search")
async def search_influencers(
    request: Request,
    q: Optional[str] = None,
    specialty: Optional[str] = None,
    platform: Optional[str] = None,
    min_followers: Optional[int] = None,
    max_price: Optional[float] = None,
    badge: Optional[str] = None,
    sort: str = "rating"
):
    """Search and filter influencers"""
    await require_auth(request)
    
    # Build query
    query = {"user_type": "influencer"}
    
    # Get all influencer users
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    results = []
    for user in users:
        # Get profile
        profile = await db.influencer_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
        # Get stats
        stats = await db.influencer_stats.find_one({"user_id": user["user_id"]}, {"_id": 0})
        # Get reviews for avg rating
        reviews = await db.reviews.find({"reviewed_user_id": user["user_id"]}).to_list(100)
        avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
        
        # Combine data
        influencer = {
            "user_id": user["user_id"],
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "picture": user.get("picture"),
            "badge": user.get("badge"),
            "bio": profile.get("bio", "") if profile else "",
            "specialties": profile.get("specialties", []) if profile else [],
            "starting_price": profile.get("starting_price", 0) if profile else 0,
            "instagram_followers": stats.get("instagram_followers", 0) if stats else 0,
            "youtube_subscribers": stats.get("youtube_subscribers", 0) if stats else 0,
            "tiktok_followers": stats.get("tiktok_followers", 0) if stats else 0,
            "twitter_followers": stats.get("twitter_followers", 0) if stats else 0,
            "total_followers": (
                (stats.get("instagram_followers", 0) if stats else 0) +
                (stats.get("youtube_subscribers", 0) if stats else 0) +
                (stats.get("tiktok_followers", 0) if stats else 0) +
                (stats.get("twitter_followers", 0) if stats else 0)
            ),
            "avg_rating": avg_rating,
            "review_count": len(reviews),
            "created_at": user.get("created_at")
        }
        
        # Apply filters
        if q:
            q_lower = q.lower()
            name_match = q_lower in influencer["name"].lower()
            specialty_match = any(q_lower in s.lower() for s in influencer["specialties"])
            bio_match = q_lower in influencer["bio"].lower()
            if not (name_match or specialty_match or bio_match):
                continue
        
        if specialty:
            if specialty not in influencer["specialties"]:
                continue
        
        if platform:
            platform_followers = {
                "instagram": influencer["instagram_followers"],
                "youtube": influencer["youtube_subscribers"],
                "tiktok": influencer["tiktok_followers"],
                "twitter": influencer["twitter_followers"]
            }
            if platform_followers.get(platform, 0) == 0:
                continue
        
        if min_followers and influencer["total_followers"] < min_followers:
            continue
        
        if max_price and influencer["starting_price"] > max_price:
            continue
        
        if badge and influencer["badge"] != badge:
            continue
        
        results.append(influencer)
    
    # Sort results
    if sort == "rating":
        results.sort(key=lambda x: x["avg_rating"], reverse=True)
    elif sort == "followers":
        results.sort(key=lambda x: x["total_followers"], reverse=True)
    elif sort == "price_low":
        results.sort(key=lambda x: x["starting_price"] or float('inf'))
    elif sort == "price_high":
        results.sort(key=lambda x: x["starting_price"], reverse=True)
    elif sort == "newest":
        results.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
    
    return results

# ============= FAVORITES ROUTES =============

@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites(request: Request):
    """Get user's favorite jobs"""
    user = await require_auth(request)
    
    favorites = await db.favorites.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("favorited_at", -1).to_list(100)
    
    return [Favorite(**f) for f in favorites]

@api_router.post("/favorites/{job_id}")
async def add_favorite(request: Request, job_id: str):
    """Add a job to favorites"""
    user = await require_auth(request)
    
    # Check if job exists
    job = await db.job_posts.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    favorite_doc = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "job_id": job_id,
        "title": job["title"],
        "description": job.get("description", ""),
        "category": job.get("category", ""),
        "budget": job.get("budget"),
        "is_featured": job.get("is_featured", False),
        "is_urgent": job.get("is_urgent", False),
        "favorited_at": datetime.now(timezone.utc)
    }
    
    await db.favorites.insert_one(favorite_doc)
    favorite_doc.pop("_id", None)
    
    return {"message": "Added to favorites", "favorite": favorite_doc}

@api_router.delete("/favorites/{job_id}")
async def remove_favorite(request: Request, job_id: str):
    """Remove a job from favorites"""
    user = await require_auth(request)
    
    result = await db.favorites.delete_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites/{job_id}/check")
async def check_favorite(request: Request, job_id: str):
    """Check if a job is in favorites"""
    user = await require_auth(request)
    
    existing = await db.favorites.find_one({
        "user_id": user.user_id,
        "job_id": job_id
    })
    
    return {"is_favorite": existing is not None}

# ============= FAZ 3: FILE UPLOAD ROUTES =============

ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_file_type(content_type: str) -> str:
    if content_type in ALLOWED_IMAGE_TYPES:
        return 'image'
    elif content_type in ALLOWED_VIDEO_TYPES:
        return 'video'
    elif content_type in ALLOWED_DOC_TYPES:
        return 'document'
    return 'unknown'

@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Generic file upload endpoint"""
    await require_auth(request)
    
    # Validate file type
    content_type = file.content_type or 'application/octet-stream'
    file_type = get_file_type(content_type)
    
    if file_type == 'unknown':
        raise HTTPException(status_code=400, detail="File type not allowed. Allowed: images, videos, PDFs")
    
    # Generate unique filename
    ext = Path(file.filename).suffix if file.filename else '.bin'
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed")
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Get file URL
    file_url = f"/uploads/{unique_filename}"
    
    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_type": file_type,
        "file_size": len(content),
        "url": file_url,
        "content_type": content_type
    }

# ============= FAZ 3: CHAT WITH ATTACHMENTS =============

@api_router.post("/matches/{match_id}/messages/with-attachment")
async def send_message_with_attachment(
    request: Request,
    match_id: str,
    message: str = Form(""),
    file: UploadFile = File(None)
):
    """Send message with optional file attachment"""
    user = await require_auth(request)
    
    # Verify match access
    match_doc = await db.matches.find_one({"match_id": match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    attachment_data = None
    
    # Handle file upload if present
    if file and file.filename:
        content_type = file.content_type or 'application/octet-stream'
        file_type = get_file_type(content_type)
        
        if file_type == 'unknown':
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        ext = Path(file.filename).suffix if file.filename else '.bin'
        unique_filename = f"chat_{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        try:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed")
            with open(file_path, "wb") as buffer:
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        attachment_id = f"attach_{uuid.uuid4().hex[:12]}"
        attachment_data = {
            "attachment_id": attachment_id,
            "message_id": message_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_type": file_type,
            "file_size": len(content),
            "url": f"/uploads/{unique_filename}",
            "content_type": content_type
        }
    
    # Create message
    msg_doc = {
        "message_id": message_id,
        "match_id": match_id,
        "sender_user_id": user.user_id,
        "sender_name": user.name,
        "message": message,
        "attachment": attachment_data,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(msg_doc)
    
    msg_doc.pop("_id", None)
    return msg_doc

# ============= FAZ 3: CONTRACT ROUTES =============

@api_router.post("/contracts", response_model=Contract)
async def create_contract(request: Request, contract_data: ContractCreate):
    """Create a new contract for a match"""
    user = await require_auth(request)
    
    # Get match
    match_doc = await db.matches.find_one({"match_id": contract_data.match_id})
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is part of this match
    if match_doc["brand_user_id"] != user.user_id and match_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your match")
    
    # Check if contract already exists for this match
    existing = await db.contracts.find_one({"match_id": contract_data.match_id, "status": {"$nin": ["cancelled"]}})
    if existing:
        raise HTTPException(status_code=400, detail="Contract already exists for this match")
    
    contract_id = f"contract_{uuid.uuid4().hex[:12]}"
    
    contract_doc = {
        "contract_id": contract_id,
        "match_id": contract_data.match_id,
        "job_id": match_doc["job_id"],
        "brand_user_id": match_doc["brand_user_id"],
        "influencer_user_id": match_doc["influencer_user_id"],
        "title": contract_data.title,
        "description": contract_data.description,
        "total_amount": contract_data.total_amount,
        "payment_terms": contract_data.payment_terms,
        "start_date": contract_data.start_date,
        "end_date": contract_data.end_date,
        "terms_and_conditions": contract_data.terms_and_conditions,
        "status": "draft",
        "brand_signed": False,
        "influencer_signed": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.contracts.insert_one(contract_doc)
    
    # Notify other party
    other_user_id = match_doc["influencer_user_id"] if user.user_id == match_doc["brand_user_id"] else match_doc["brand_user_id"]
    await create_notification(
        user_id=other_user_id,
        type="contract",
        title="Yeni Sözleşme!",
        message=f"{user.name} bir sözleşme taslağı oluşturdu: {contract_data.title}",
        link=f"/contracts/{contract_id}"
    )
    
    contract_doc.pop("_id", None)
    return Contract(**contract_doc)

@api_router.get("/contracts/my-contracts")
async def get_my_contracts(request: Request):
    """Get all contracts for current user"""
    user = await require_auth(request)
    
    query = {"$or": [
        {"brand_user_id": user.user_id},
        {"influencer_user_id": user.user_id}
    ]}
    
    contracts = await db.contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Add match info
    for contract in contracts:
        match_doc = await db.matches.find_one({"match_id": contract["match_id"]}, {"_id": 0})
        if match_doc:
            contract["job_title"] = match_doc.get("job_title")
            contract["brand_name"] = match_doc.get("brand_name")
            contract["influencer_name"] = match_doc.get("influencer_name")
    
    return contracts

@api_router.get("/contracts/{contract_id}")
async def get_contract(request: Request, contract_id: str):
    """Get contract details"""
    user = await require_auth(request)
    
    contract_doc = await db.contracts.find_one({"contract_id": contract_id}, {"_id": 0})
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify access
    if contract_doc["brand_user_id"] != user.user_id and contract_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    
    # Get milestones
    milestones = await db.milestones.find({"contract_id": contract_id}, {"_id": 0}).sort("due_date", 1).to_list(100)
    contract_doc["milestones"] = milestones
    
    # Get match info
    match_doc = await db.matches.find_one({"match_id": contract_doc["match_id"]}, {"_id": 0})
    if match_doc:
        contract_doc["job_title"] = match_doc.get("job_title")
        contract_doc["brand_name"] = match_doc.get("brand_name")
        contract_doc["influencer_name"] = match_doc.get("influencer_name")
    
    return contract_doc

@api_router.post("/contracts/{contract_id}/sign")
async def sign_contract(request: Request, contract_id: str):
    """Sign a contract"""
    user = await require_auth(request)
    
    contract_doc = await db.contracts.find_one({"contract_id": contract_id})
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify access
    if contract_doc["brand_user_id"] != user.user_id and contract_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    
    # Update signature
    update_field = "brand_signed" if user.user_id == contract_doc["brand_user_id"] else "influencer_signed"
    
    await db.contracts.update_one(
        {"contract_id": contract_id},
        {"$set": {update_field: True, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Check if both signed
    contract_doc = await db.contracts.find_one({"contract_id": contract_id})
    if contract_doc["brand_signed"] and contract_doc["influencer_signed"]:
        await db.contracts.update_one(
            {"contract_id": contract_id},
            {"$set": {"status": "active"}}
        )
        
        # Notify both parties
        for uid in [contract_doc["brand_user_id"], contract_doc["influencer_user_id"]]:
            await create_notification(
                user_id=uid,
                type="contract",
                title="Sözleşme Aktif!",
                message="Sözleşme her iki tarafça imzalandı ve aktif hale geldi",
                link=f"/contracts/{contract_id}"
            )
    else:
        # Notify other party
        other_user_id = contract_doc["influencer_user_id"] if user.user_id == contract_doc["brand_user_id"] else contract_doc["brand_user_id"]
        await create_notification(
            user_id=other_user_id,
            type="contract",
            title="Sözleşme İmzalandı!",
            message=f"{user.name} sözleşmeyi imzaladı. Sizin de imzalamanız bekleniyor.",
            link=f"/contracts/{contract_id}"
        )
    
    return {"message": "Contract signed successfully"}

@api_router.post("/contracts/{contract_id}/complete")
async def complete_contract(request: Request, contract_id: str):
    """Mark contract as completed"""
    user = await require_auth(request)
    
    contract_doc = await db.contracts.find_one({"contract_id": contract_id})
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only brand can complete
    if contract_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Only brand can complete contract")
    
    if contract_doc["status"] != "active":
        raise HTTPException(status_code=400, detail="Contract must be active to complete")
    
    await db.contracts.update_one(
        {"contract_id": contract_id},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Update influencer stats
    await db.influencer_stats.update_one(
        {"user_id": contract_doc["influencer_user_id"]},
        {"$inc": {"completed_jobs": 1}},
        upsert=True
    )
    
    # Notify influencer
    await create_notification(
        user_id=contract_doc["influencer_user_id"],
        type="contract",
        title="Sözleşme Tamamlandı!",
        message="Tebrikler! Sözleşme başarıyla tamamlandı.",
        link=f"/contracts/{contract_id}"
    )
    
    return {"message": "Contract completed successfully"}

# ============= FAZ 3: MILESTONE ROUTES =============

@api_router.post("/contracts/{contract_id}/milestones")
async def create_milestone(request: Request, contract_id: str, milestone_data: MilestoneCreate):
    """Add a milestone to a contract"""
    user = await require_auth(request)
    
    contract_doc = await db.contracts.find_one({"contract_id": contract_id})
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify access
    if contract_doc["brand_user_id"] != user.user_id and contract_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    
    milestone_id = f"milestone_{uuid.uuid4().hex[:12]}"
    
    milestone_doc = {
        "milestone_id": milestone_id,
        "contract_id": contract_id,
        "title": milestone_data.title,
        "description": milestone_data.description,
        "due_date": milestone_data.due_date,
        "amount": milestone_data.amount,
        "status": "pending",
        "submission_note": None,
        "submission_files": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.milestones.insert_one(milestone_doc)
    
    milestone_doc.pop("_id", None)
    return milestone_doc

@api_router.get("/contracts/{contract_id}/milestones")
async def get_milestones(request: Request, contract_id: str):
    """Get all milestones for a contract"""
    user = await require_auth(request)
    
    contract_doc = await db.contracts.find_one({"contract_id": contract_id})
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract_doc["brand_user_id"] != user.user_id and contract_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your contract")
    
    milestones = await db.milestones.find({"contract_id": contract_id}, {"_id": 0}).sort("due_date", 1).to_list(100)
    
    return milestones

@api_router.post("/milestones/{milestone_id}/submit")
async def submit_milestone(
    request: Request,
    milestone_id: str,
    note: str = Form(""),
    files: List[UploadFile] = File([])
):
    """Submit milestone for approval"""
    user = await require_role(request, ["influencer"])
    
    milestone_doc = await db.milestones.find_one({"milestone_id": milestone_id})
    if not milestone_doc:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    contract_doc = await db.contracts.find_one({"contract_id": milestone_doc["contract_id"]})
    if contract_doc["influencer_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your milestone")
    
    # Handle file uploads
    file_urls = []
    for file in files:
        if file.filename:
            ext = Path(file.filename).suffix
            unique_filename = f"milestone_{uuid.uuid4().hex}{ext}"
            file_path = UPLOAD_DIR / unique_filename
            
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            file_urls.append(f"/uploads/{unique_filename}")
    
    await db.milestones.update_one(
        {"milestone_id": milestone_id},
        {"$set": {
            "status": "submitted",
            "submission_note": note,
            "submission_files": file_urls,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Notify brand
    await create_notification(
        user_id=contract_doc["brand_user_id"],
        type="milestone",
        title="Milestone Teslim Edildi!",
        message=f"{user.name} bir milestone teslim etti: {milestone_doc['title']}",
        link=f"/contracts/{milestone_doc['contract_id']}"
    )
    
    return {"message": "Milestone submitted successfully"}

@api_router.post("/milestones/{milestone_id}/approve")
async def approve_milestone(request: Request, milestone_id: str):
    """Approve a submitted milestone"""
    user = await require_role(request, ["marka"])
    
    milestone_doc = await db.milestones.find_one({"milestone_id": milestone_id})
    if not milestone_doc:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    contract_doc = await db.contracts.find_one({"contract_id": milestone_doc["contract_id"]})
    if contract_doc["brand_user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your milestone")
    
    if milestone_doc["status"] != "submitted":
        raise HTTPException(status_code=400, detail="Milestone must be submitted to approve")
    
    await db.milestones.update_one(
        {"milestone_id": milestone_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Notify influencer
    await create_notification(
        user_id=contract_doc["influencer_user_id"],
        type="milestone",
        title="Milestone Onaylandı!",
        message=f"Milestone onaylandı: {milestone_doc['title']}",
        link=f"/contracts/{milestone_doc['contract_id']}"
    )
    
    return {"message": "Milestone approved"}

# ============= FAZ 3: MEDIA LIBRARY ROUTES =============

@api_router.post("/media-library")
async def upload_to_media_library(
    request: Request,
    file: UploadFile = File(...),
    tags: str = Form(""),
    description: str = Form("")
):
    """Upload file to influencer's media library"""
    user = await require_role(request, ["influencer"])
    
    content_type = file.content_type or 'application/octet-stream'
    file_type = get_file_type(content_type)
    
    if file_type == 'unknown':
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    ext = Path(file.filename).suffix if file.filename else '.bin'
    unique_filename = f"media_{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed")
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    media_id = f"media_{uuid.uuid4().hex[:12]}"
    
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    media_doc = {
        "media_id": media_id,
        "user_id": user.user_id,
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_type": file_type,
        "file_size": len(content),
        "url": f"/uploads/{unique_filename}",
        "thumbnail_url": None,
        "tags": tag_list,
        "description": description,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.media_library.insert_one(media_doc)
    
    media_doc.pop("_id", None)
    return media_doc

@api_router.get("/media-library")
async def get_my_media_library(request: Request, file_type: Optional[str] = None):
    """Get influencer's media library"""
    user = await require_role(request, ["influencer"])
    
    query = {"user_id": user.user_id}
    if file_type:
        query["file_type"] = file_type
    
    media = await db.media_library.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return media

@api_router.delete("/media-library/{media_id}")
async def delete_media(request: Request, media_id: str):
    """Delete media from library"""
    user = await require_role(request, ["influencer"])
    
    media_doc = await db.media_library.find_one({"media_id": media_id})
    if not media_doc:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if media_doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your media")
    
    # Delete file
    file_path = UPLOAD_DIR / media_doc["filename"]
    if file_path.exists():
        file_path.unlink()
    
    await db.media_library.delete_one({"media_id": media_id})
    
    return {"message": "Media deleted"}

# ============= FAZ 3: ADVANCED SEARCH =============

@api_router.get("/search/jobs")
async def search_jobs(
    q: Optional[str] = None,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    experience_level: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """Advanced job search with filters"""
    query = {"status": "open"}
    
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"brand_name": {"$regex": q, "$options": "i"}}
        ]
    
    if category:
        query["category"] = category
    
    if platform:
        query["platforms"] = platform
    
    if min_budget is not None:
        query["budget"] = query.get("budget", {})
        query["budget"]["$gte"] = min_budget
    
    if max_budget is not None:
        query["budget"] = query.get("budget", {})
        query["budget"]["$lte"] = max_budget
    
    if experience_level:
        query["experience_level"] = experience_level
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    jobs = await db.job_posts.find(query, {"_id": 0}).sort(sort_by, sort_direction).to_list(100)
    
    return {
        "results": jobs,
        "total": len(jobs)
    }

@api_router.get("/search/influencers")
async def search_influencers(
    q: Optional[str] = None,
    specialty: Optional[str] = None,
    min_followers: Optional[int] = None,
    min_rating: Optional[float] = None,
    platform: Optional[str] = None,
    sort_by: str = "total_reach",
    sort_order: str = "desc"
):
    """Advanced influencer search with filters"""
    # Get profiles
    profile_query = {}
    
    if q:
        profile_query["$or"] = [
            {"bio": {"$regex": q, "$options": "i"}}
        ]
    
    if specialty:
        profile_query["specialties"] = specialty
    
    profiles = await db.influencer_profiles.find(profile_query, {"_id": 0}).to_list(200)
    
    # Get stats and filter
    results = []
    for profile in profiles:
        user_doc = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0, "password_hash": 0})
        stats_doc = await db.influencer_stats.find_one({"user_id": profile["user_id"]}, {"_id": 0})
        
        if not user_doc:
            continue
        
        # Apply filters
        if min_followers and stats_doc:
            if (stats_doc.get("total_reach", 0) or 0) < min_followers:
                continue
        
        if min_rating and stats_doc:
            if (stats_doc.get("average_rating", 0) or 0) < min_rating:
                continue
        
        if platform and profile.get("social_media"):
            if not profile["social_media"].get(platform):
                continue
        
        results.append({
            "user": user_doc,
            "profile": profile,
            "stats": stats_doc
        })
    
    # Sort
    if sort_by == "total_reach":
        results.sort(key=lambda x: (x.get("stats") or {}).get("total_reach", 0) or 0, reverse=(sort_order == "desc"))
    elif sort_by == "average_rating":
        results.sort(key=lambda x: (x.get("stats") or {}).get("average_rating", 0) or 0, reverse=(sort_order == "desc"))
    elif sort_by == "starting_price":
        results.sort(key=lambda x: x.get("profile", {}).get("starting_price", 0) or 0, reverse=(sort_order == "desc"))
    
    return {
        "results": results[:50],
        "total": len(results)
    }

# ============= SETTINGS ROUTES =============

@api_router.get("/settings")
async def get_settings(request: Request):
    """Get user settings"""
    user = await require_auth(request)
    
    settings_doc = await db.user_settings.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not settings_doc:
        # Create default settings
        settings_doc = {
            "user_id": user.user_id,
            "theme": "dark",
            "language": "tr",
            "notifications": {
                "email_new_job": True,
                "email_application_status": True,
                "email_messages": True,
                "email_marketing": False,
                "push_new_job": True,
                "push_application_status": True,
                "push_messages": True
            },
            "privacy": {
                "profile_visible": True,
                "show_stats_to_brands": True,
                "show_in_search": True
            },
            "updated_at": datetime.now(timezone.utc)
        }
        await db.user_settings.insert_one(settings_doc)
        settings_doc.pop("_id", None)
    
    # Get user info
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    
    # Get session history
    sessions = await db.user_sessions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    return {
        "user": user_doc,
        "settings": settings_doc,
        "sessions": sessions
    }

@api_router.put("/settings/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    """Update user profile"""
    user = await require_auth(request)
    
    update_fields = {}
    if profile_data.name:
        update_fields["name"] = profile_data.name
    if profile_data.bio is not None:
        update_fields["bio"] = profile_data.bio
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_fields}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return user_doc

@api_router.post("/settings/profile-photo")
async def upload_profile_photo(request: Request, file: UploadFile = File(...)):
    """Upload profile photo"""
    user = await require_auth(request)
    
    content_type = file.content_type or ''
    if not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    ext = Path(file.filename).suffix if file.filename else '.jpg'
    unique_filename = f"profile_{user.user_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit for profile photos
        raise HTTPException(status_code=400, detail="File too large. Max 5MB allowed")
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    photo_url = f"/uploads/{unique_filename}"
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"picture": photo_url}}
    )
    
    return {"picture": photo_url}

@api_router.put("/settings/password")
async def change_password(request: Request, password_data: PasswordChange):
    """Change user password"""
    user = await require_auth(request)
    
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="Cannot change password for social login accounts")
    
    if not verify_password(password_data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password
    new_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.put("/settings/email")
async def change_email(request: Request, email_data: EmailChange):
    """Change user email"""
    user = await require_auth(request)
    
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if user_doc.get("password_hash"):
        if not verify_password(email_data.password, user_doc["password_hash"]):
            raise HTTPException(status_code=400, detail="Password is incorrect")
    
    # Check if email is already taken
    existing = await db.users.find_one({"email": email_data.new_email})
    if existing and existing["user_id"] != user.user_id:
        raise HTTPException(status_code=400, detail="Email is already in use")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"email": email_data.new_email}}
    )
    
    return {"message": "Email changed successfully", "email": email_data.new_email}

@api_router.put("/settings/notifications")
async def update_notification_settings(request: Request, notif_settings: NotificationSettings):
    """Update notification preferences"""
    user = await require_auth(request)
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "notifications": notif_settings.model_dump(),
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Notification settings updated"}

@api_router.put("/settings/privacy")
async def update_privacy_settings(request: Request, privacy_settings: PrivacySettings):
    """Update privacy preferences"""
    user = await require_auth(request)
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "privacy": privacy_settings.model_dump(),
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Privacy settings updated"}

@api_router.put("/settings/theme")
async def update_theme(request: Request, theme: str = Form(...)):
    """Update theme preference"""
    user = await require_auth(request)
    
    if theme not in ["dark", "light"]:
        raise HTTPException(status_code=400, detail="Invalid theme. Must be 'dark' or 'light'")
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "theme": theme,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Theme updated", "theme": theme}

@api_router.put("/settings/language")
async def update_language(request: Request, language: str = Form(...)):
    """Update language preference"""
    user = await require_auth(request)
    
    if language not in ["tr", "en"]:
        raise HTTPException(status_code=400, detail="Invalid language. Must be 'tr' or 'en'")
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "language": language,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Language updated", "language": language}

@api_router.post("/settings/deactivate")
async def deactivate_account(request: Request, password: str = Form(...)):
    """Deactivate (freeze) user account"""
    user = await require_auth(request)
    
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if user_doc.get("password_hash"):
        if not verify_password(password, user_doc["password_hash"]):
            raise HTTPException(status_code=400, detail="Password is incorrect")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"status": "deactivated", "deactivated_at": datetime.now(timezone.utc)}}
    )
    
    # Clear session
    await db.sessions.delete_many({"user_id": user.user_id})
    
    return {"message": "Account deactivated"}

@api_router.delete("/settings/delete-account")
async def delete_account(request: Request, password: str = Form(...)):
    """Permanently delete user account"""
    user = await require_auth(request)
    
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if user_doc.get("password_hash"):
        if not verify_password(password, user_doc["password_hash"]):
            raise HTTPException(status_code=400, detail="Password is incorrect")
    
    # Delete all user data
    await db.users.delete_one({"user_id": user.user_id})
    await db.sessions.delete_many({"user_id": user.user_id})
    await db.user_settings.delete_one({"user_id": user.user_id})
    await db.influencer_profiles.delete_one({"user_id": user.user_id})
    await db.brand_profiles.delete_one({"user_id": user.user_id})
    await db.influencer_stats.delete_one({"user_id": user.user_id})
    await db.notifications.delete_many({"user_id": user.user_id})
    await db.favorites.delete_many({"user_id": user.user_id})
    await db.media_library.delete_many({"user_id": user.user_id})
    
    return {"message": "Account deleted permanently"}

@api_router.get("/settings/sessions")
async def get_sessions(request: Request):
    """Get user session history"""
    user = await require_auth(request)
    
    sessions = await db.user_sessions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return sessions

@api_router.delete("/settings/sessions/{session_id}")
async def revoke_session(request: Request, session_id: str):
    """Revoke a specific session"""
    user = await require_auth(request)
    
    result = await db.sessions.delete_one({
        "session_token": session_id,
        "user_id": user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session revoked"}

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
