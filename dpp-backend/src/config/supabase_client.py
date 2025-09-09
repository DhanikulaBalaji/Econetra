import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    Uses service key for server-side operations.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Supabase URL and Service Key must be set in environment variables")
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_supabase_anon_client() -> Client:
    """
    Create and return a Supabase client instance with anonymous key.
    Used for client-side operations and authentication.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and Anonymous Key must be set in environment variables")
    
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Global client instances
supabase_client = None
supabase_anon_client = None

try:
    supabase_client = get_supabase_client()
    supabase_anon_client = get_supabase_anon_client()
except ValueError as e:
    print(f"Warning: Supabase client initialization failed: {e}")
    print("Please configure SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file")

