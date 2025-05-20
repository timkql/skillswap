from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class User(BaseModel):
    """User model representing the data structure in Firestore"""
    # Authentication
    uid: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    
    # Profile Information
    name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    country: str = Field(..., min_length=2, max_length=2)  # ISO 3166-1 alpha-2 country code
    profile_picture_url: Optional[str] = None
    
    # Skills
    learning_skills: List[str] = Field(default_factory=list)
    teaching_skills: List[str] = Field(default_factory=list)
    
    # Status
    onboarding_completed: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class UserResponse(User):
    """Model for user data as returned in API responses"""
    pass 