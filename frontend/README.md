# Champollion Frontend

Modern, dark-themed React frontend for the Champollion course management and transcription platform.

## 🎨 Design Features

- **Dark Mode by Default**: Slate-900 background with elegant contrast
- **Orange Accent Color**: `#f97316` for primary actions and highlights
- **Dock Navigation**: macOS-style bottom navigation bar
- **Folder Organization**: File-explorer style course management
- **React Bits Components**: 12 animated UI components from reactbits.dev
- **Mandatory Waveform**: Real-time audio visualization during recording

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router v7
- **Data Fetching**: SWR (stale-while-revalidate)
- **Forms**: React Hook Form
- **Audio**: react-audio-voice-recorder

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication forms
│   │   ├── common/            # Layout, ProtectedRoute
│   │   ├── project/           # Project-related components (formerly course/)
│   │   └── ui/                # React Bits UI components
│   ├── contexts/              # AuthContext
│   ├── hooks/                 # SWR API hooks
│   ├── lib/                   # API client, utilities
│   ├── pages/                 # Page components
│   ├── types/                 # TypeScript types
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── tailwind.config.js        # Tailwind configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:8000`

### Installation
```bash
cd frontend
npm install
```

### Environment Setup
Create a `.env` file (or use defaults):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Development
```bash
npm run dev
```
Open http://localhost:5173

### Build
```bash
npm run build
```

## 📄 Pages

### Public Pages
- `/login` - Login with PixelBlast background
- `/register` - Registration with PixelBlast background

### Protected Pages (with Dock navigation)
- `/dashboard` - Course list with Folder components
- `/courses/:id` - Course detail with tabs:
  - **Recording**: Record or upload audio with Waveform visualization
  - **Transcription**: Launch and view transcription
  - **Notes**: Generate and view structured notes
- `/settings` - API key management

## 🎯 User Flow

1. **Register/Login** → Dark form with orange accents
2. **Dashboard** → View courses as folders, create new course
3. **Course Detail** → 
   - **Record** audio with live waveform OR upload file
   - **Transcribe** → Launch and poll status (5s intervals)
   - **Notes** → Generate structured notes, copy markdown
4. **Settings** → Configure API key for STT/LLM services

## 🔧 API Integration

### Base URL
Default: `http://localhost:8000/api`

### Authentication
- JWT tokens stored in `localStorage`
- Auto-redirect to `/login` on 401
- Token sent in `Authorization: Bearer <token>` header

### Hooks
- `useAuth()` - Login, register, logout, updateApiKey
- `useCourses()` - List courses
- `useCourse(id)` - Get course details
- `useCreateCourse()` - Create course
- `useUploadRecording(courseId)` - Upload audio
- `useLaunchTranscription(courseId)` - Start transcription
- `useTranscriptionStatus(courseId, poll)` - Poll transcription
- `useGenerateNotes(courseId)` - Generate notes
- `useNotesStatus(courseId, poll)` - Poll notes generation

## 🎨 UI Components (React Bits)

All components are copied from https://reactbits.dev (TS-TW variant):

### Backgrounds
- `PixelBlast` - Orange animated particles for auth pages

### Navigation
- `Dock` - Bottom navigation with magnification

### Forms & Inputs
- `AnimatedInput` - Smooth focus animations
- `AnimatedButton` - Click/hover animations

### Display
- `Card` - Elevated dark cards
- `Badge` - Status indicators (gray/amber/green)
- `Folder` - File-explorer style course display
- `Spinner` - Loading states
- `ProgressBar` - Upload/processing progress
- `Waveform` - **MANDATORY** audio visualization

### Audio Recording

Nota: les navigateurs enregistrent souvent en **WebM (Opus)**. C’est accepté en upload; la conversion en WAV est gérée côté backend lors de la transcription.

### Browser Recording
- Uses `react-audio-voice-recorder` hook
- Real-time waveform visualization (mandatory)
- WebM format output
- Duration counter

### File Upload
- Accepted formats: `.mp3`, `.wav`, `.m4a`, `.webm`
- Max duration: 2 hours
- Progress bar during upload

## 📝 Transcription & Notes

### Transcription

Note: le backend convertit automatiquement vos enregistrements en WAV (mono 16 kHz) avant l'envoi au provider STT pour éviter les rejets 422 liés aux fichiers WebM identifiés comme `video/webm`. Aucun changement requis côté frontend.
- Launch button disabled until recording uploaded
- Polls status every 5 seconds
- Displays success/error states
- Shows transcript in monospace font

### Notes Generation
- Requires successful transcription
- Polls status every 5 seconds
- Displays as formatted Markdown
- Copy to clipboard functionality

## 🌐 Responsive Design

- Mobile-first approach
- Tailwind breakpoints: `sm`, `md`, `lg`
- Dock adapts to screen size
- Folders stack on mobile

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus states on all inputs/buttons
- Dark mode optimized for contrast

## 🔐 Security

- JWT tokens in localStorage (consider httpOnly cookies for production)
- API keys encrypted server-side
- CORS configured on backend
- Input validation via react-hook-form

## 🐛 Troubleshooting

### API Connection Issues
- Si vous voyez `422 Invalid file format` côté STT (Mistral):
  - Assurez-vous que le backend est à jour (conversion WAV et `mime_type` explicite activés).
  - Vérifiez que FFmpeg est installé sur la machine du backend.
- Si `Unable to determine audio duration`:
  - Le backend tolère désormais ce cas (durée=0) — mettez à jour le backend si besoin.
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` in `.env`

### Audio Recording Not Working
- Grant browser microphone permissions
- Test in HTTPS context (required for MediaRecorder)
- Check browser compatibility (Chrome/Edge recommended)

### Build Errors
- Clear `node_modules` and `package-lock.json`, reinstall
- Check Node.js version (18+)
- Verify all dependencies in `package.json`

## 📚 Documentation References

- [UI Spec V2](../docs/ui_specification_v2.md)
- [Frontend Plan](../docs/frontend_plan.md)
- [API Spec](../docs/api_spec.md)
- [MVP Spec](../docs/MVP_spec.md)

## 🎯 MVP Status

✅ All MVP features implemented:
- [x] Authentication (login/register)
- [x] Course CRUD
- [x] Audio recording with waveform
- [x] File upload with drag-and-drop
- [x] Transcription launch and polling
- [x] Notes generation and display
- [x] Settings page for API key
- [x] Dock navigation
- [x] Dark mode theme
- [x] Folder-based course organization

## 🚧 Future Enhancements (Post-MVP)

- Real-time collaboration
- Advanced Markdown editor
- Audio waveform editing
- Course sharing
- Export to PDF
- Mobile app (React Native)
- Internationalization (i18n)

---

**Built with ❤️ for Champollion** 🏛️
