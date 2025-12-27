import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 FLULANCE Seed Data başlatılıyor...")
    
    # Admin user
    admin_exists = await db.users.find_one({"email": "admin@flulance.com"})
    if not admin_exists:
        password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_user = {
            "user_id": "user_admin001",
            "email": "admin@flulance.com",
            "password_hash": password_hash,
            "name": "FLULANCE Admin",
            "user_type": "admin",
            "picture": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin kullanıcısı oluşturuldu (email: admin@flulance.com, şifre: admin123)")
    else:
        print("ℹ️  Admin kullanıcısı zaten mevcut")
    
    # Sample brand user
    brand_exists = await db.users.find_one({"email": "marka@test.com"})
    if not brand_exists:
        password_hash = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        brand_user = {
            "user_id": "user_brand001",
            "email": "marka@test.com",
            "password_hash": password_hash,
            "name": "Örnek Marka",
            "user_type": "marka",
            "picture": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(brand_user)
        print("✅ Örnek marka kullanıcısı oluşturuldu (email: marka@test.com, şifre: test123)")
    else:
        print("ℹ️  Örnek marka kullanıcısı zaten mevcut")
    
    # Sample influencer users
    influencers = [
        {
            "user_id": "user_inf001",
            "email": "ayse@influencer.com",
            "name": "Ayşe Demir",
            "user_type": "influencer",
            "bio": "Moda ve lifestyle içerik üreticisi. Günlük hayattan samimi kareler paylaşıyorum.",
            "specialties": ["Moda", "Lifestyle", "Güzellik"],
            "starting_price": 5000,
            "social_media": {
                "instagram": "@aysedemir",
                "tiktok": "@aysedemir",
                "youtube": None
            },
            "image_url": "https://i.pravatar.cc/400?img=1"
        },
        {
            "user_id": "user_inf002",
            "email": "mehmet@influencer.com",
            "name": "Mehmet Yılmaz",
            "user_type": "influencer",
            "bio": "Teknoloji ve oyun dünyasından haberler. 250K+ takipçiyle buluşuyorum.",
            "specialties": ["Teknoloji", "Oyun", "İnceleme"],
            "starting_price": 8000,
            "social_media": {
                "instagram": "@mehmetyilmaz",
                "tiktok": None,
                "youtube": "Mehmet Yılmaz Tech"
            },
            "image_url": "https://i.pravatar.cc/400?img=12"
        },
        {
            "user_id": "user_inf003",
            "email": "zeynep@influencer.com",
            "name": "Zeynep Kaya",
            "user_type": "influencer",
            "bio": "Yemek tarifleri ve mutfak ipuçları. Her gün yeni lezzetler keşfediyoruz!",
            "specialties": ["Yemek", "Mutfak", "Tarif"],
            "starting_price": 3500,
            "social_media": {
                "instagram": "@zeynepkaya",
                "tiktok": "@zeynepinyemekleri",
                "youtube": "Zeynep'in Mutfağı"
            },
            "image_url": "https://i.pravatar.cc/400?img=5"
        },
        {
            "user_id": "user_inf004",
            "email": "can@influencer.com",
            "name": "Can Öztürk",
            "user_type": "influencer",
            "bio": "Fitness ve sağlıklı yaşam koçu. Hedeflerine ulaşman için buradayım!",
            "specialties": ["Fitness", "Sağlık", "Motivasyon"],
            "starting_price": 6000,
            "social_media": {
                "instagram": "@canozturk",
                "tiktok": "@canozturk_fit",
                "youtube": None
            },
            "image_url": "https://i.pravatar.cc/400?img=33"
        }
    ]
    
    for inf in influencers:
        user_exists = await db.users.find_one({"email": inf["email"]})
        if not user_exists:
            password_hash = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_doc = {
                "user_id": inf["user_id"],
                "email": inf["email"],
                "password_hash": password_hash,
                "name": inf["name"],
                "user_type": inf["user_type"],
                "picture": inf["image_url"],
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_doc)
            
            # Create profile
            profile_doc = {
                "profile_id": f"profile_{inf['user_id']}",
                "user_id": inf["user_id"],
                "bio": inf["bio"],
                "specialties": inf["specialties"],
                "portfolio_items": [],
                "starting_price": inf["starting_price"],
                "social_media": inf["social_media"],
                "image_url": inf["image_url"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            await db.influencer_profiles.insert_one(profile_doc)
            
            print(f"✅ Influencer oluşturuldu: {inf['name']}")
        else:
            print(f"ℹ️  {inf['name']} zaten mevcut")
    
    # Sample job posts
    job_exists = await db.job_posts.find_one({"job_id": "job_sample001"})
    if not job_exists:
        sample_jobs = [
            {
                "job_id": "job_sample001",
                "brand_user_id": "user_brand001",
                "brand_name": "Örnek Marka",
                "title": "Yeni Ürün Lansmanı İçin Story Serisi",
                "description": "Yeni çıkan ürünümüz için Instagram Story serisi hazırlanmasını istiyoruz. 3 günlük story planı.",
                "category": "Ürün Tanıtımı",
                "budget": 7500,
                "platforms": ["instagram"],
                "status": "open",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "job_id": "job_sample002",
                "brand_user_id": "user_brand001",
                "brand_name": "Örnek Marka",
                "title": "TikTok Viral Video Kampanyası",
                "description": "Trendi yakalayan, eğlenceli TikTok videosu. Minimum 100K görüntülenme garantisi bekliyoruz.",
                "category": "Video İçerik",
                "budget": 12000,
                "platforms": ["tiktok"],
                "status": "open",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        
        for job in sample_jobs:
            await db.job_posts.insert_one(job)
        
        print(f"✅ {len(sample_jobs)} örnek iş ilanı oluşturuldu")
    else:
        print("ℹ️  Örnek iş ilanları zaten mevcut")
    
    # Commission settings
    commission_exists = await db.commission_settings.find_one({})
    if not commission_exists:
        commission_doc = {
            "percentage": 15.0,
            "updated_at": datetime.now(timezone.utc)
        }
        await db.commission_settings.insert_one(commission_doc)
        print("✅ Komisyon ayarları oluşturuldu (%15)")
    else:
        print("ℹ️  Komisyon ayarları zaten mevcut")
    
    client.close()
    print("\n🎉 Seed data başarıyla tamamlandı!")
    print("\n📝 Test Kullanıcıları:")
    print("   Admin: admin@flulance.com / admin123")
    print("   Marka: marka@test.com / test123")
    print("   Influencer'lar: ayse@influencer.com, mehmet@influencer.com, vb. / test123")

if __name__ == "__main__":
    asyncio.run(seed_database())
