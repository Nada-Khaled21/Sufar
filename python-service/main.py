"""
Sufar AI Service - FastAPI
==========================
يشغّل الـ recommendation model وبيرد على Node.js backend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import random
import os
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors

# ============================================================
# APP SETUP
# ============================================================

app = FastAPI(title="Sufar AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOAD DATA FILES
# ============================================================

BASE_DIR = Path(__file__).parent

def load_json(filename):
    path = BASE_DIR / filename
    if not path.exists():
        print(f"⚠️  {filename} not found")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

intents_data     = load_json("intents.json")
cities_dataset   = load_json("../citiesDataset.json")
destination_data = load_json("../destination.json")

# ============================================================
# CORE DATA
# ============================================================

budget_map = {"low": 1, "medium": 2, "high": 3}

ALL_ACTIVITIES = [
    "religious", "shopping", "luxury", "family", "business",
    "beach", "sea_view", "relaxation", "honeymoon", "pool",
    "spa", "historical", "culture", "city_walks", "nightlife",
    "food", "romantic", "water_villa", "nature", "wellness"
]

cities = [
    {"name_en": "Cairo",          "name_ar": "القاهرة",         "activities": ["historical","culture","shopping","city_walks","nightlife","food"],       "budget_level": "medium", "best_duration": [2,3,4,5]},
    {"name_en": "Alexandria",     "name_ar": "الإسكندرية",      "activities": ["sea_view","historical","culture","city_walks","food","romantic"],          "budget_level": "medium", "best_duration": [2,3,4]},
    {"name_en": "Sharm El Sheikh","name_ar": "شرم الشيخ",       "activities": ["beach","sea_view","relaxation","honeymoon","pool","spa","family"],         "budget_level": "high",   "best_duration": [3,4,5,6]},
    {"name_en": "Hurghada",       "name_ar": "الغردقة",         "activities": ["beach","sea_view","family","pool","spa","relaxation"],                     "budget_level": "medium", "best_duration": [3,4,5]},
    {"name_en": "Luxor",          "name_ar": "الأقصر",          "activities": ["historical","culture","relaxation","romantic","city_walks","nature"],       "budget_level": "medium", "best_duration": [2,3,4,5]},
    {"name_en": "Aswan",          "name_ar": "أسوان",           "activities": ["historical","culture","relaxation","romantic","nature","city_walks"],       "budget_level": "medium", "best_duration": [2,3,4,5,6,7]},
    {"name_en": "Jeddah",         "name_ar": "جدة",             "activities": ["sea_view","shopping","luxury","city_walks","food","honeymoon"],             "budget_level": "medium", "best_duration": [2,3,4,5]},
    {"name_en": "Makkah",         "name_ar": "مكة",             "activities": ["religious","family","city_walks"],                                         "budget_level": "high",   "best_duration": [2,3,4,5,6]},
    {"name_en": "Madinah",        "name_ar": "المدينة المنورة", "activities": ["religious","family","relaxation","city_walks"],                            "budget_level": "medium", "best_duration": [2,3,4,5]},
    {"name_en": "Riyadh",         "name_ar": "الرياض",          "activities": ["business","luxury","shopping","city_walks","food"],                        "budget_level": "high",   "best_duration": [2,3,4]},
    {"name_en": "Dubai",          "name_ar": "دبي",             "activities": ["luxury","shopping","city_walks","business","family","romantic"],            "budget_level": "high",   "best_duration": [3,4,5]},
    {"name_en": "Abu Dhabi",      "name_ar": "أبو ظبي",         "activities": ["luxury","culture","family","city_walks","business"],                       "budget_level": "high",   "best_duration": [2,3,4]},
    {"name_en": "Doha",           "name_ar": "الدوحة",          "activities": ["luxury","culture","shopping","food","city_walks"],                         "budget_level": "high",   "best_duration": [2,3,4]},
    {"name_en": "Beirut",         "name_ar": "بيروت",           "activities": ["food","nightlife","culture","city_walks","shopping"],                      "budget_level": "medium", "best_duration": [2,3,4]},
    {"name_en": "Amman",          "name_ar": "عمان",            "activities": ["historical","culture","food","city_walks","shopping"],                     "budget_level": "medium", "best_duration": [2,3,4]},
    {"name_en": "Istanbul",       "name_ar": "إسطنبول",         "activities": ["historical","culture","shopping","food","city_walks","romantic"],          "budget_level": "medium", "best_duration": [3,4,5]},
    {"name_en": "London",         "name_ar": "لندن",            "activities": ["business","shopping","city_walks","historical","culture","food"],           "budget_level": "high",   "best_duration": [3,4,5]},
    {"name_en": "Paris",          "name_ar": "باريس",           "activities": ["romantic","luxury","shopping","culture","historical","honeymoon"],          "budget_level": "high",   "best_duration": [3,4,5,6]},
    {"name_en": "Rome",           "name_ar": "روما",            "activities": ["historical","culture","food","romantic","city_walks"],                     "budget_level": "medium", "best_duration": [3,4,5]},
    {"name_en": "Barcelona",      "name_ar": "برشلونة",         "activities": ["beach","culture","food","city_walks","nightlife"],                         "budget_level": "medium", "best_duration": [3,4,5]},
    {"name_en": "New York",       "name_ar": "نيويورك",         "activities": ["business","shopping","city_walks","nightlife","food","culture"],           "budget_level": "high",   "best_duration": [3,4,5]},
    {"name_en": "Los Angeles",    "name_ar": "لوس أنجلوس",      "activities": ["beach","shopping","city_walks","nightlife","food"],                        "budget_level": "high",   "best_duration": [3,4,5]},
    {"name_en": "Tokyo",          "name_ar": "طوكيو",           "activities": ["culture","shopping","food","city_walks","historical"],                     "budget_level": "high",   "best_duration": [4,5,6]},
    {"name_en": "Maldives",       "name_ar": "المالديف",        "activities": ["water_villa","beach","sea_view","honeymoon","luxury","relaxation","spa","wellness"], "budget_level": "high", "best_duration": [4,5,6,7]},
]

# ============================================================
# INTENT MATCHER
# ============================================================

class IntentMatcher:
    def __init__(self, data):
        self.intents = data.get("intents", []) if data else []
        self.pattern_texts = []
        self.pattern_tags = []

        for intent in self.intents:
            for pattern in intent.get("patterns", []):
                self.pattern_texts.append(pattern.lower())
                self.pattern_tags.append(intent["tag"])

        if self.pattern_texts:
            self.vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
            self.pattern_vectors = self.vectorizer.fit_transform(self.pattern_texts)
        else:
            self.vectorizer = None
            self.pattern_vectors = None

    def predict(self, text: str, threshold: float = 0.20):
        if not self.vectorizer:
            return None, 0.0

        query_vec = self.vectorizer.transform([text.lower()])
        scores = cosine_similarity(query_vec, self.pattern_vectors)[0]
        best_idx = int(np.argmax(scores))
        best_score = float(scores[best_idx])

        if best_score < threshold:
            return None, best_score

        return self.pattern_tags[best_idx], best_score

    def get_response(self, tag: str) -> dict:
        for intent in self.intents:
            if intent["tag"] == tag:
                responses = intent.get("responses", [])
                en = [r for r in responses if any("a" <= c.lower() <= "z" for c in r)]
                ar = [r for r in responses if any("\u0600" <= c <= "\u06FF" for c in r)]
                return {
                    "en": random.choice(en) if en else random.choice(responses),
                    "ar": random.choice(ar) if ar else random.choice(responses),
                }
        return {"en": "I'm here to help!", "ar": "أنا هنا للمساعدة!"}

intent_matcher = IntentMatcher(intents_data)

# ============================================================
# RECOMMENDATION ENGINE
# ============================================================

def activities_to_vector(selected, universe):
    return [1 if a in selected else 0 for a in universe]

def recommend_city(activities: list, budget: str, duration: int):
    user_vec = np.array([activities_to_vector(activities, ALL_ACTIVITIES)])
    city_vecs = np.array([activities_to_vector(c["activities"], ALL_ACTIVITIES) for c in cities])
    scores = cosine_similarity(user_vec, city_vecs)[0]

    scored = []
    for i, city in enumerate(cities):
        score = float(scores[i])
        if duration in city["best_duration"]:
            score += 0.10
        if city["budget_level"] == budget:
            score += 0.10
        elif budget == "high":
            score += 0.05
        scored.append((city, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0][0], round(scored[0][1], 3)

def recommend_hotels_for_city(city_name: str, activities: list, budget: str, duration: int, top_k: int = 3):
    """يجيب فنادق المدينة من citiesDataset.json"""
    hotels = []

    for city_obj in cities_dataset:
        if city_obj.get("city", "").lower() == city_name.lower():
            for h in city_obj.get("hotels", []):
                hotels.append({
                    "name": h.get("name", ""),
                    "slug": h.get("slug", ""),
                    "stars": h.get("stars", 4),
                    "rating": h.get("rating", 4.0),
                    "startingFrom": h.get("startingFrom", 0),
                    "locationType": h.get("locationType", ""),
                    "facilities": h.get("facilities", []),
                    "images": h.get("images", []),
                })
            break

    if not hotels:
        return []

    # Sort by rating
    hotels.sort(key=lambda h: h["rating"], reverse=True)
    return hotels[:top_k]

def build_itinerary(city_name: str, activities: list, duration: int) -> list:
    """يبني itinerary يوم بيوم"""

    # جيب أنشطة المدينة من destination.json
    city_activities = []
    for dest in destination_data:
        if dest.get("name", "").lower() == city_name.lower():
            city_activities = [a.get("title", "") for a in dest.get("activities", [])]
            break

    # Fallback activities
    fallback = [
        "Explore the city center",
        "Visit local markets",
        "Try local cuisine",
        "Free exploration",
        "Relax at hotel",
        "Evening walk",
        "Cultural tour",
        "Shopping time",
    ]

    all_options = city_activities + fallback
    itinerary = []

    for day in range(1, duration + 1):
        # اختار 2-3 أنشطة لكل يوم
        day_activities = []
        start = (day - 1) * 3
        for i in range(3):
            idx = (start + i) % len(all_options)
            act = all_options[idx]
            if act not in [a["name"] for a in day_activities]:
                day_activities.append({
                    "name": act,
                    "type": "attraction"
                })

        # اليوم الأول دايمًا فيه check-in
        if day == 1:
            day_activities.insert(0, {"name": "Check-in at hotel and rest", "type": "hotel"})

        # اليوم الأخير فيه check-out
        if day == duration:
            day_activities.append({"name": "Check-out and prepare for departure", "type": "departure"})

        day_titles = {
            1: "Arrival & First Impressions",
            2: "Culture & Heritage",
            3: "Exploration Day",
            4: "Leisure & Relaxation",
            5: "Adventure Day",
            6: "Local Experience",
            7: "Final Day",
        }

        itinerary.append({
            "day": day,
            "title": day_titles.get(day, f"Day {day}"),
            "activities": day_activities
        })

    return itinerary

# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class RecommendRequest(BaseModel):
    activities: List[str]
    budget: str           # low / medium / high
    duration: int         # عدد الأيام
    travelers: Optional[int] = 2

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "both"  # en / ar / both

class IntentResponse(BaseModel):
    tag: Optional[str]
    score: float
    response: dict

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {"message": "Sufar AI Service is running 🚀", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/recommend")
def recommend(req: RecommendRequest):
    """
    الـ endpoint الرئيسي — بيرجع:
    - المدينة المقترحة
    - أحسن 3 فنادق
    - Itinerary يوم بيوم
    """
    if req.budget not in budget_map:
        raise HTTPException(status_code=400, detail="budget must be: low, medium, or high")

    if req.duration < 1 or req.duration > 14:
        raise HTTPException(status_code=400, detail="duration must be between 1 and 14 days")

    # 1. recommend city
    city, score = recommend_city(req.activities, req.budget, req.duration)

    # 2. recommend hotels
    hotels = recommend_hotels_for_city(
        city["name_en"], req.activities, req.budget, req.duration
    )

    # 3. build itinerary
    itinerary = build_itinerary(city["name_en"], req.activities, req.duration)

    return {
        "city": {
            "name_en": city["name_en"],
            "name_ar": city["name_ar"],
            "match_score": score,
        },
        "hotels": hotels,
        "itinerary": itinerary,
        "meta": {
            "duration": req.duration,
            "budget": req.budget,
            "travelers": req.travelers,
            "activities": req.activities,
        }
    }

@app.post("/chat")
def chat(req: ChatRequest):
    """
    Chat endpoint — بيرد على أسئلة اليوزر بناءً على الـ intents
    """
    tag, score = intent_matcher.predict(req.message)

    if tag is None:
        return {
            "tag": None,
            "score": score,
            "response": {
                "en": "I'm not sure I understood. Could you rephrase that?",
                "ar": "لم أفهم جيداً، هل يمكنك إعادة الصياغة؟"
            }
        }

    response = intent_matcher.get_response(tag)

    return {
        "tag": tag,
        "score": round(score, 3),
        "response": response
    }

@app.get("/cities")
def get_cities():
    """قائمة المدن المتاحة للـ recommendation"""
    return {
        "cities": [
            {"name_en": c["name_en"], "name_ar": c["name_ar"]}
            for c in cities
        ]
    }

@app.get("/activities")
def get_activities():
    """قائمة الـ activities المتاحة"""
    return {"activities": ALL_ACTIVITIES}
