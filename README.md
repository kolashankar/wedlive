## WedLive - Wedding Event Management Platform

A full-stack wedding event management platform with live streaming capabilities.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Live Streaming**: RTMP support

## Project Structure

```
wedlive/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
├── render.yaml        # Deployment configuration
├── nginx-rtmp-config-template.conf  # NGINX RTMP configuration
├── NGINX_RTMP_SETUP_GUIDE.md       # RTMP setup guide
└── RTMP_STREAMING_GUIDE.md         # Streaming guide
```

## Getting Started

### Frontend Setup

```bash
cd frontend
yarn install
yarn dev
```

The frontend will run on `http://localhost:3000`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The backend will run on `http://localhost:8001`

## Environment Variables

### Frontend (.env)
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- Other service-specific variables

## Deployment

See `render.yaml` for deployment configuration on Render.com

For RTMP streaming setup, refer to:
- `NGINX_RTMP_SETUP_GUIDE.md`
- `RTMP_STREAMING_GUIDE.md`
- `nginx-rtmp-config-template.conf`

## Features

- Wedding event management
- Photo/video galleries
- Live streaming support
- Theme customization
- Border and background management
- Guest management
- Admin dashboard

## License

Proprietary
