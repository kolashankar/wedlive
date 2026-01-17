# Slideshow & Album Management Plan

This plan details the implementation of Album and Slideshow features, inspired by the "imagination" repository logic but adapted for a web-based React/FastAPI architecture.

## Phase 1: Backend Architecture (Models & APIs)
**Goal:** Create the data structures and API endpoints to manage albums and their slideshow configuration.

1.  **Data Models (`backend/app/models.py`)**
    *   `Album`: Represents a collection of media with slideshow settings.
        *   `id`: UUID
        *   `wedding_id`: UUID
        *   `title`: String
        *   `description`: String
        *   `cover_photo_url`: String (optional)
        *   `music_url`: String (optional)
        *   `slides`: List[AlbumSlide]
    *   `AlbumSlide`: Represents a photo within the album.
        *   `media_id`: UUID (reference to Media)
        *   `order`: Integer
        *   `duration`: Float (default 5.0s)
        *   `transition`: Enum (NONE, FADE, WIPE, ZOOM, etc.)
        *   `transition_duration`: Float (default 1.0s)
        *   `animation`: Enum (NONE, KEN_BURNS, RANDOM, etc.)

2.  **API Routes (`backend/app/routes/albums.py`)**
    *   `POST /api/albums`: Create a new album.
    *   `GET /api/albums/{wedding_id}`: List all albums for a wedding.
    *   `GET /api/albums/{album_id}`: Get album details with slides.
    *   `PUT /api/albums/{album_id}`: Update album metadata (title, music).
    *   `DELETE /api/albums/{album_id}`: Delete an album.
    *   `POST /api/albums/{album_id}/slides`: Add media items to album as slides.
    *   `PUT /api/albums/{album_id}/slides`: Update slide settings (order, transition, duration).
    *   `DELETE /api/albums/{album_id}/slides/{slide_index}`: Remove a slide.

3.  **Integration**
    *   Register `albums.router` in `backend/server.py`.

## Phase 2: Frontend Management (Creator Dashboard)
**Goal:** Allow creators to create albums, upload photos, and organize them.

1.  **Components**
    *   `AlbumManager.js`:
        *   List existing albums with cover photos.
        *   "Create New Album" button/modal.
        *   Edit/Delete actions for albums.
    *   `AlbumDetail.js` (or `AlbumEditor.js`):
        *   View slides in a grid/list.
        *   Drag-and-drop reordering (using `dnd-kit` or similar if available, or simple up/down).
        *   "Add Photos" button (opens MediaSelector or Upload).
        *   Settings panel:
            *   Set per-slide duration.
            *   Set transition type (Fade, Wipe, etc.).
            *   Set animation type (Ken Burns, etc.).
            *   Background Music selector.

2.  **Integration**
    *   Update `frontend/app/weddings/manage/[id]/page.js` to add an "Albums" section or sub-tab under "Media".

## Phase 3: Slideshow Player (Web Implementation)
**Goal:** Play the album as an animated slideshow for end-users.

1.  **Components**
    *   `SlideshowPlayer.js`:
        *   Full-screen overlay or embedded player.
        *   Logic to cycle through slides based on `duration`.
        *   Implementation of Transitions using CSS/Framer Motion.
            *   *Fade*: Opacity 0->1.
            *   *Wipe*: Clip-path animation.
            *   *Zoom/Ken Burns*: Scale/Translate animation.
        *   Audio Player integration for background music.

2.  **Integration**
    *   Add "Play Slideshow" button on Album card.
    *   Embed player in Public View (`frontend/app/view/[id]/page.js`).

## Phase 4: Advanced Features (Reference Repo Parity)
**Goal:** Add advanced transitions and export capabilities.

1.  **Advanced Transitions**
    *   Implement more complex "imagination" style transitions (Clock wipe, Matrix wipe) using HTML5 Canvas or WebGL (Three.js/Pixi.js).
2.  **Export (Optional)**
    *   Server-side rendering of slideshow to MP4 (using FFmpeg composition service) for download.

