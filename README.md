npx supabase start

cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd mobile && npx expo start --clear --android.

