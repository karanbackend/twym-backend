# 🎯 TWYM Connect - API User Stories aur Interactions (Hinglish)

> **Hinglish Guide**: Backend aur UI kaise interact karte hain, har step ke liye kaunsa API call hota hai, aur data flow kaise hota hai - sab kuch simple stories ke through samjhenge.

---

## 📱 App Structure Overview

```
TWYM Connect Backend = NestJS Framework
├── Users Management (User Registration, Profile Creation)
├── Profiles (Digital Business Card)
├── Contacts (Connections/Network Management)
├── Contact Forms (Inquiries/Leads)
├── Calendar (Event Management Integration)
└── Storage (Files aur Images)
```

---

## 🎭 COMPLETE USER JOURNEY - STEP BY STEP

### **Phase 1: App Khola aur Authentication** 🔓

#### Story 1.1: "User ne app khola"

```
┌─────────────────────────────────────────────────────────┐
│ USER OPENS APP                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ UI CHECKS TOKEN      │
        │ (Local Storage mein) │
        └──────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ✅ Token Valid?      ❌ Token Invalid?
         │                   │
         ▼                   ▼
    Go to Home         Go to Login Screen
    
BACKEND API: GET /api/v1
│
└─> Response: { version, status, features } 
    (Public endpoint, koi auth nahi chahiye)
```

**API Call (UI se):**
```javascript
// Step 1: App Load ke time
GET /api/v1
// Response milega:
{
  "version": "1.0.0",
  "status": "running",
  "features": ["contacts", "profiles", "calendar", ...]
}
```

---

#### Story 1.2: "User Login/Signup kiya (Supabase ke through)"

```
USER ENTERS CREDENTIALS
        ▼
SUPABASE AUTHENTICATES
        ▼
TOKEN MILA (JWT in local storage)
        ▼
BACKEND APIS UNLOCK
(Token attach hota hai har request mein)
```

**Data Flow:**
- Frontend: Supabase library use karta hai authentication ke liye
- Backend: Har request mein `Authorization: Bearer <token>` header check hota hai
- Guard: `SupabaseAuthGuard` validate karta hai token ko

**Token kya hota hai?** JWT Token = Encrypted identity card jo bata de:
- User ID
- Email
- Expiry time
- Other user info

---

### **Phase 2: Profile Setup** 👤

#### Story 2.1: "User ne apna digital business card banaya"

```
USER CLICKS "CREATE PROFILE"
        ▼
┌──────────────────────────────────────┐
│ FRONTEND FORM DIKHAYI:               │
│ - Name (full)                        │
│ - Title (Job title)                  │
│ - Bio                                │
│ - Profile Picture                    │
│ - Handle (Unique username)           │
│ - Profile Link                       │
└──────────┬───────────────────────────┘
           ▼
   USER FILLS FORM
           ▼
   USER CLICKS "SAVE"
           ▼
   ┌──────────────────────────────────────┐
   │ BACKEND API CALL:                    │
   │ POST /profiles                       │
   │ Authorization: Bearer <token>        │
   │                                      │
   │ Body:                                │
   │ {                                    │
   │   "firstName": "Raj",                │
   │   "lastName": "Kumar",               │
   │   "jobTitle": "Software Engineer",   │
   │   "bio": "Building amazing apps",    │
   │   "profileHandle": "raj-kumar",      │
   │   "deeplinkSlug": "raj-kumar",       │
   │   ...other fields                    │
   │ }                                    │
   └──────────┬───────────────────────────┘
              ▼
        ✅ PROFILE CREATED
              ▼
        SERVER RETURNS:
        {
          "id": "uuid-123",
          "userId": "user-uuid",
          "firstName": "Raj",
          "profileHandle": "raj-kumar",
          "createdAt": "2025-01-01T10:00:00Z",
          ...
        }
              ▼
        PROFILE SAVED IN DATABASE
```

**Related APIs (Profile Management):**

| Action | API Endpoint | Method | Description |
|--------|--------------|--------|-------------|
| Profile Create | `/profiles` | POST | Naya profile banao |
| List All Profiles | `/profiles` | GET | Sab profiles dekho (Public) |
| Get My Profile | `/profiles/by-user/:userId` | GET | Apna profile dekho |
| Get Profile by Handle | `/profiles/by-handle/:handle` | GET | Handle ke through profile dekho |
| Get Profile by Deeplink | `/profiles/by-slug/:slug` | GET | Unique slug ke through dekho |
| Update Profile | `/profiles/:id` | PATCH | Profile update karo |
| Delete Profile | `/profiles/:id` | DELETE | Profile delete karo |

---

#### Story 2.2: "User ne apne profile mein phone number add kiya"

```
USER VIEWS PROFILE EDIT PAGE
        ▼
CLICKS "ADD PHONE NUMBER"
        ▼
┌──────────────────────────────────────┐
│ FORM APPEARS:                        │
│ - Phone Number                       │
│ - Type (Mobile/Work/Home)            │
│ - Is Primary? (checkbox)             │
└──────────┬───────────────────────────┘
           ▼
USER FILLS DETAILS
           ▼
CLICKS SAVE
           ▼
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /profiles/:id/phone-numbers         │
│                                          │
│ Body:                                    │
│ {                                        │
│   "number": "+91-98765-43210",           │
│   "type": "mobile",                      │
│   "isPrimary": true                      │
│ }                                        │
└──────────┬───────────────────────────────┘
           ▼
     ✅ PHONE NUMBER ADDED
           ▼
      RETURNS:
      {
        "id": "phone-uuid",
        "profileId": "profile-uuid",
        "number": "+91-98765-43210",
        "type": "mobile",
        "isPrimary": true
      }
```

**Profile ke Sections ke APIs:**

| Section | API Endpoint | Method | Description |
|---------|--------------|--------|-------------|
| Phone Numbers | `/profiles/:id/phone-numbers` | POST | Phone number add karo |
| | `/profiles/:id/phone-numbers/:phoneId` | PATCH | Update karo |
| | `/profiles/:id/phone-numbers/:phoneId` | DELETE | Delete karo |
| Emails | `/profiles/:id/emails` | POST | Email add karo |
| | `/profiles/:id/emails/:emailId` | PATCH/DELETE | Update/Delete |
| Addresses | `/profiles/:id/addresses` | POST | Address add karo |
| | `/profiles/:id/addresses/:addressId` | PATCH/DELETE | Update/Delete |
| Links | `/profiles/:id/links` | POST | Social media link add karo |
| | `/profiles/:id/links/:linkId` | PATCH/DELETE | Update/Delete |

---

#### Story 2.3: "User ne apne profile ki vCard (Digital Business Card) export ki"

```
USER VIEWS PROFILE
        ▼
CLICKS "DOWNLOAD VCARD"
        ▼
┌──────────────────────────────────────────┐
│ BACKEND GENERATES VCARD:                 │
│ GET /profiles/:id/vcard                  │
│                                          │
│ Response: ICS/VCF file                   │
│ (.vcf format - compatible with all      │
│  contact apps - WhatsApp, Telegram etc)  │
└──────────┬───────────────────────────────┘
           ▼
      FILE DOWNLOADED
           ▼
   USER SHARES WITH OTHERS
   (Whatsapp, Email, etc)
           ▼
OTHER USER IMPORT KARTA HAI
(Apne phone contacts mein)
```

**vCard APIs:**

| Action | API | Method |
|--------|-----|--------|
| Download vCard | `/profiles/:id/vcard` | GET |
| Get vCard Metadata | `/profiles/:id/vcard-metadata` | GET |
| Update vCard Privacy | `/profiles/:id/vcard-privacy` | PATCH |

---

#### Story 2.4: "User ne apne profile ko public/private banaya"

```
USER TOGGLES PROFILE VISIBILITY SWITCH
        ▼
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ PATCH /profiles/:id/visibility           │
│                                          │
│ Body:                                    │
│ {                                        │
│   "isPublic": false                      │
│ }                                        │
└──────────┬───────────────────────────────┘
           ▼
✅ PROFILE VISIBILITY UPDATED
           ▼
Public = QR Code scan kar sakte hain others
Private = Sirf invite ke through dekh sakte hain
```

---

### **Phase 3: Contact Management - Network Building** 👥

#### Story 3.1: "User ko event mein kisi se meet hua"

```
SCENARIO 1: QR CODE SCAN KIYA
────────────────────────────
Other Person ka QR Code scan kiya
        ▼
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /contacts/scan                      │
│                                          │
│ Body:                                    │
│ {                                        │
│   "qrData": "profile-uuid-of-other",     │
│   "method": "qr_scan"                    │
│ }                                        │
└──────────┬───────────────────────────────┘
           ▼
     ✅ CONTACT ADDED
           ▼
  Contact saved in "My Network"
  (Database mein entry ho gaya)

────────────────────────────────
SCENARIO 2: MANUALLY ADD KIYA
────────────────────────────────
User ne hand se contact fill kiya
        ▼
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /contacts                           │
│                                          │
│ Body:                                    │
│ {                                        │
│   "firstName": "Priya",                  │
│   "lastName": "Singh",                   │
│   "jobTitle": "Product Manager",         │
│   "email": "priya@company.com",          │
│   "phoneNumbers": [...],                 │
│   "addresses": [...],                    │
│   ...                                    │
│ }                                        │
└──────────┬───────────────────────────────┘
           ▼
     ✅ CONTACT CREATED MANUALLY
           ▼
  Profile se import nahi, manual entry
```

**Contact Management APIs:**

| Action | API Endpoint | Method |
|--------|--------------|--------|
| Create Contact (Manual) | `/contacts` | POST |
| Create from QR Scan | `/contacts/scan` | POST |
| Create from Badge Scan | `/contacts/scan` | POST |
| List All Contacts | `/contacts` | GET |
| Get Contact Detail | `/contacts/:id` | GET |
| Update Contact | `/contacts/:id` | PATCH |
| Delete Contact | `/contacts/:id` | DELETE |
| Export as vCard | `/contacts/:id/vcard` | GET |
| Export as PDF | `/contacts/:id/pdf` | GET |

---

#### Story 3.2: "User ne business card scan kiya"

```
USER TAKES PHOTO OF BUSINESS CARD
        ▼
┌──────────────────────────────────────────────┐
│ FRONTEND UPLOADS IMAGE TO BACKEND:           │
│ POST /contacts/upload-business-card          │
│ Content-Type: multipart/form-data            │
│                                              │
│ Body:                                        │
│ - file: <image-buffer> (jpg/png/pdf)        │
│ - side: "front" or "back"                   │
│ - name (optional): Contact ka name          │
└──────────┬───────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────┐
│ BACKEND PROCESSING:                          │
│ 1. File storage mein save kiya               │
│    (Supabase Storage)                        │
│ 2. Google Vision API ko call kiya            │
│    (OCR - Optical Character Recognition)    │
│ 3. Text extract kiya:                        │
│    - Name, Email, Phone, Company, etc       │
│ 4. AI process: Data clean-up, formatting    │
│ 5. Contact entity create kiya database mein  │
└──────────┬───────────────────────────────────┘
           ▼
      ✅ CONTACT CREATED WITH OCR
           ▼
      RETURNS:
      {
        "id": "contact-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumbers": [...],
        "company": "Tech Corp",
        "jobTitle": "Developer",
        "businessCardImages": [
          {
            "id": "file-uuid",
            "side": "front",
            "url": "https://storage.../image.jpg"
          }
        ]
      }
           ▼
USER REVIEWS DATA
(Edit kar sakte hain agar galat ho)
           ▼
CONTACT SAVED
```

**Business Card OCR Flow Diagram:**

```
User uploads image
        ↓
Backend stores in Supabase
        ↓
Google Vision API (OCR)
        ↓
Extract text
        ↓
Parse (Name, Email, Phone)
        ↓
Save to Database
        ↓
Return to UI
        ↓
User reviews & confirms
```

---

#### Story 3.3: "User ne phone contacts import kiye"

```
USER WANTS TO IMPORT CONTACTS FROM PHONE
        ↓
┌────────────────────────────────────────┐
│ Frontend Mobile App:                   │
│ - Uses Native Contact Access API       │
│ - Extracts contact details             │
└────────────┬─────────────────────────┘
             ↓
   USER SELECTS CONTACTS TO IMPORT
             ↓
┌────────────────────────────────────────┐
│ BACKEND API:                           │
│ POST /contacts/import-from-phone       │
│                                        │
│ Body:                                  │
│ {                                      │
│   "contacts": [                        │
│     {                                  │
│       "firstName": "Amit",             │
│       "lastName": "Patel",             │
│       "phoneNumbers": [                │
│         { "number": "+91...", ...}     │
│       ],                               │
│       "emails": [...],                 │
│       "address": {...}                 │
│     },                                 │
│     ...more contacts                   │
│   ]                                    │
│ }                                      │
└────────────┬─────────────────────────┘
             ↓
   BULK INSERT IN DATABASE
             ↓
✅ ALL CONTACTS IMPORTED
```

---

### **Phase 4: Contact Forms - Receiving Inquiries** 📋

#### Story 4.1: "User ne apna contact form create kiya"

```
USER SETUP PAGE MEIN GAYA
        ↓
CLICKED "CREATE CONTACT FORM"
        ↓
┌─────────────────────────────────────┐
│ FORM BUILDER DIKHAYI:               │
│ - Title                             │
│ - Description                       │
│ - Fields to collect                 │
│   (Name, Email, Phone, etc)        │
│ - Custom message                    │
└─────────────┬───────────────────────┘
              ↓
        USER FILLS FORM
              ↓
      CLICKS "CREATE"
              ↓
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /contact-forms                      │
│ Authorization: Bearer <token>            │
│                                          │
│ Body:                                    │
│ {                                        │
│   "title": "Project Inquiry",            │
│   "description": "Tell me about...",     │
│   "fields": [                            │
│     {                                    │
│       "name": "fullName",                │
│       "type": "text",                    │
│       "required": true                   │
│     },                                   │
│     {                                    │
│       "name": "email",                   │
│       "type": "email",                   │
│       "required": true                   │
│     },                                   │
│     {                                    │
│       "name": "message",                 │
│       "type": "textarea",                │
│       "required": true                   │
│     }                                    │
│   ]                                      │
│ }                                        │
└──────────────┬───────────────────────────┘
               ↓
     ✅ FORM CREATED IN DATABASE
               ↓
           RETURNS:
           {
             "id": "form-uuid",
             "userId": "user-uuid",
             "profileId": "profile-uuid",
             "title": "Project Inquiry",
             ...
           }
               ↓
        FORM IS NOW LIVE
   (Doosre log submit kar sakte hain)
```

**Contact Forms Setup APIs:**

| Action | API | Method |
|--------|-----|--------|
| Create Contact Form | `/contact-forms` | POST |
| Get My Form | `/contact-forms/my-form` | GET |
| Update My Form | `/contact-forms/my-form` | PATCH |
| Delete My Form | `/contact-forms/my-form` | DELETE |
| Get Public Form | `/contact-forms/public/:profileId` | GET |

---

#### Story 4.2: "Visitor ne contact form submit kiya (Public)"

```
┌────────────────────────────────────────┐
│ VISITOR (NO LOGIN) VISITS PROFILE:     │
│ https://app.com/raj-kumar              │
└────────────┬─────────────────────────┘
             ↓
   PROFILE PAGE DIKHAYI
   (With contact form widget)
             ↓
VISITOR FILLS FORM:
- Name: "Neha"
- Email: "neha@company.com"
- Message: "Want to collaborate..."
             ↓
CLICKS "SUBMIT"
             ↓
┌────────────────────────────────────────────┐
│ BACKEND API (NO AUTH NEEDED):              │
│ POST /contact-forms/submit/:profileId      │
│ (Rate limit: 10 per day per IP)            │
│                                            │
│ Body:                                      │
│ {                                          │
│   "fullName": "Neha",                      │
│   "email": "neha@company.com",             │
│   "message": "Want to collaborate...",     │
│   "visitorIp": "203.0.113.45",             │
│   "userAgent": "Mozilla/5.0...",           │
│   "referrer": "google.com"                 │
│ }                                          │
└────────────┬───────────────────────────────┘
             ↓
    ✅ SUBMISSION RECORDED
             ↓
RETURNS:
{
  "id": "submission-uuid",
  "formId": "form-uuid",
  "visitorName": "Neha",
  "visitorEmail": "neha@company.com",
  "createdAt": "2025-01-01T10:00:00Z",
  "read": false
}
             ↓
VISITOR SEES THANK YOU MESSAGE
             ↓
USER (Profile Owner) KO NOTIFICATION
(In their inbox)
```

**Public Form Submission API:**

| Action | API | Method | Auth? |
|--------|-----|--------|-------|
| Submit Form | `/contact-forms/submit/:profileId` | POST | ❌ No |
| Get Form | `/contact-forms/public/:profileId` | GET | ❌ No |

---

#### Story 4.3: "User apne inbox check kiya (Submissions dekhe)"

```
USER CLICKS "INBOX"
        ↓
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ GET /contact-forms/submissions           │
│ Authorization: Bearer <token>            │
│                                          │
│ (Optional query params:)                 │
│ ?unreadOnly=true                         │
│ ?page=1&limit=20                         │
└──────────┬───────────────────────────────┘
           ↓
      ✅ SUBMISSIONS FETCHED
           ↓
      RETURNS:
      [
        {
          "id": "submission-uuid",
          "visitorName": "Neha",
          "visitorEmail": "neha@company.com",
          "message": "Want to collaborate...",
          "createdAt": "2025-01-01T10:00:00Z",
          "read": false
        },
        ...more submissions
      ]
           ↓
   LIST SHOWS IN UI
   (Unread ones highlighted)
```

**Inbox APIs:**

| Action | API | Method |
|--------|-----|--------|
| Get All Submissions | `/contact-forms/submissions` | GET |
| Get Unread Count | `/contact-forms/submissions/unread-count` | GET |
| Get Single Submission | `/contact-forms/submissions/:id` | GET |
| Mark as Read | `/contact-forms/submissions/:id/mark-read` | PATCH |
| Delete Submission | `/contact-forms/submissions/:id` | DELETE |

---

#### Story 4.4: "User ne submission ko reply kiya"

```
USER OPENS SUBMISSION
        ↓
READS MESSAGE FROM VISITOR
        ↓
CLICKS "REPLY"
        ↓
TYPES RESPONSE
        ↓
CLICKS "SEND"
        ↓
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /contact-forms/submissions/:id/reply│
│ Authorization: Bearer <token>            │
│                                          │
│ Body:                                    │
│ {                                        │
│   "message": "Thanks for reaching out..."│
│ }                                        │
└──────────┬───────────────────────────────┘
           ↓
     ✅ REPLY SENT
           ↓
VISITOR GETS EMAIL NOTIFICATION
(With user's response)
```

---

### **Phase 5: Calendar Integration** 📅

#### Story 5.1: "User ne apna calendar connect kiya"

```
USER GOES TO "CALENDAR" TAB
        ↓
SEES: "Connect Google Calendar" OR "Connect Outlook"
        ↓
CLICKS "CONNECT"
        ↓
┌───────────────────────────────────────────────┐
│ FRONTEND REDIRECTS TO:                        │
│ Google/Microsoft OAuth Consent Screen         │
│ (User logs in with their calendar account)   │
└──────────┬────────────────────────────────────┘
           ↓
USER GRANTS PERMISSION
(To read calendar events)
           ↓
┌───────────────────────────────────────────────┐
│ OAUTH CALLBACK RETURNS CODE                   │
│ Frontend receives: authorization code         │
└──────────┬────────────────────────────────────┘
           ↓
┌───────────────────────────────────────────────────┐
│ BACKEND API:                                      │
│ POST /calendar/connect                            │
│ Authorization: Bearer <token>                     │
│                                                  │
│ Body:                                            │
│ {                                                │
│   "provider": "google",                          │
│   "code": "4/0AY0e..." (OAuth code)             │
│ }                                                │
└──────────┬───────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ BACKEND PROCESSING:                        │
│ 1. Exchange code for access token         │
│ 2. Store tokens in database               │
│ 3. Mark as "connected"                    │
│ 4. Schedule automatic refresh             │
│    (tokens expire, need refresh)          │
└────────────┬─────────────────────────────┘
             ↓
        ✅ CALENDAR CONNECTED
             ↓
      RETURNS:
      {
        "provider": "google",
        "status": "connected",
        "connectedAt": "2025-01-01T10:00:00Z",
        "expiresAt": "2025-01-02T10:00:00Z"
      }
             ↓
        CALENDAR ICON SHOWS ✓
```

**Calendar Connection APIs:**

| Action | API | Method |
|--------|-----|--------|
| Connect Calendar | `/calendar/connect` | POST |
| Get Connection Status | `/calendar/status` | GET |
| Disconnect Calendar | `/calendar/:provider/disconnect` | DELETE |

---

#### Story 5.2: "User ne calendar events sync kiye"

```
CALENDAR CONNECTED ✓
        ↓
USER CLICKS "SYNC EVENTS"
(OR Auto-sync triggered)
        ↓
┌──────────────────────────────────────────────┐
│ BACKEND API:                                 │
│ POST /calendar/:provider/sync                │
│ Authorization: Bearer <token>                │
│                                              │
│ Body:                                        │
│ {                                            │
│   "startDate": "2025-01-01",                 │
│   "endDate": "2025-12-31"                    │
│ }                                            │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ BACKEND PROCESSING:                      │
│ 1. Use stored access token               │
│ 2. Call Google/Microsoft Calendar API    │
│ 3. Fetch events for date range           │
│ 4. Cache results (30 minutes)            │
│ 5. Save to database                      │
└────────────┬─────────────────────────────┘
             ↓
        ✅ EVENTS SYNCED
             ↓
        RETURNS:
        [
          {
            "id": "event-123",
            "title": "Team Meeting",
            "startTime": "2025-01-01T10:00:00Z",
            "endTime": "2025-01-01T11:00:00Z",
            "location": "Meeting Room",
            "attendees": [...]
          },
          ...more events
        ]
             ↓
   EVENTS SHOW IN CALENDAR UI
```

**Calendar Event APIs:**

| Action | API | Method |
|--------|-----|--------|
| Sync Events | `/calendar/:provider/sync` | POST |
| Get Events | `/calendar/:provider/events` | GET |
| Get Cached Events | `/calendar/:provider/cached-events` | GET |

---

### **Phase 6: File Management** 📁

#### Story 6.1: "User ne profile photo upload kiya"

```
USER CLICKS "UPLOAD PHOTO"
        ↓
SELECTS IMAGE FROM DEVICE
        ↓
┌──────────────────────────────────────────────┐
│ FRONTEND PROCESSES:                          │
│ - Compress image                             │
│ - Create thumbnail                           │
│ - Resize if needed                           │
└──────────┬───────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────┐
│ BACKEND API:                                     │
│ POST /profiles/:id/upload-photo                  │
│ Content-Type: multipart/form-data                │
│ Authorization: Bearer <token>                    │
│                                                  │
│ Form Data:                                       │
│ - file: <image-buffer>                          │
│ - type: "profile" | "cover" | "gallery"        │
└──────────┬───────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ BACKEND PROCESSING:                      │
│ 1. Validate file (size, type)            │
│ 2. Generate unique filename              │
│ 3. Upload to Supabase Storage            │
│    (Cloud storage)                       │
│ 4. Generate public URL                   │
│ 5. Save reference in database            │
│ 6. Delete old photo (if exists)          │
└────────────┬─────────────────────────────┘
             ↓
        ✅ PHOTO UPLOADED
             ↓
      RETURNS:
      {
        "fileId": "file-uuid",
        "profileId": "profile-uuid",
        "fileName": "raj_profile_abc123.jpg",
        "url": "https://storage.../raj_profile_abc123.jpg",
        "uploadedAt": "2025-01-01T10:00:00Z"
      }
             ↓
   PROFILE PHOTO UPDATED IN UI
```

**File Management APIs:**

| Action | API | Method |
|--------|-----|--------|
| Upload Photo | `/profiles/:id/upload-photo` | POST |
| Get My Files | `/users/files/my-files` | GET |
| Delete File | `/users/files/:fileId` | DELETE |
| Upload Business Card | `/contacts/upload-business-card` | POST |

---

### **Phase 7: User Account Management** 🔐

#### Story 7.1: "User ne apna account delete request kiya"

```
USER GOES TO ACCOUNT SETTINGS
        ↓
CLICKS "DELETE ACCOUNT"
        ↓
┌────────────────────────────────┐
│ WARNING DIALOG SHOWS:          │
│ "Are you sure?                 │
│ Account will be deleted in 30  │
│ days. Click to confirm."       │
└────────────┬───────────────────┘
             ↓
       USER CONFIRMS
             ↓
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /users/accounts/delete              │
│ Authorization: Bearer <token>            │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ BACKEND PROCESSING:                      │
│ 1. Mark account as "deletion_pending"    │
│ 2. Lock account (no login allowed)       │
│ 3. Set deletion date (30 days later)     │
│ 4. Schedule cleanup job                  │
│    - Delete contacts                     │
│    - Delete files                        │
│    - Delete profile                      │
│    - Delete all user data                │
│ 5. Send confirmation email               │
│    (With cancellation link)              │
└────────────┬─────────────────────────────┘
             ↓
        ✅ DELETION REQUESTED
             ↓
      RETURNS:
      {
        "message": "Account deletion scheduled",
        "deletionDate": "2025-01-31T10:00:00Z",
        "canCancel": true
      }
             ↓
   USER GETS EMAIL WITH OPTIONS:
   - Cancel deletion (link)
   - Confirm deletion
```

**Account Management APIs:**

| Action | API | Method |
|--------|-----|--------|
| Request Delete | `/users/accounts/delete` | POST |
| Cancel Delete | `/users/accounts/cancel-deletion` | POST |
| Get User | `/users/:id` | GET |
| Update User | `/users/:id` | PATCH |
| Delete User | `/users/:id` | DELETE |

---

#### Story 7.2: "User ne apna deletion cancel kiya"

```
USER GETS EMAIL WITH CANCELLATION LINK
        ↓
CLICKS LINK
        ↓
┌──────────────────────────────────────────┐
│ BACKEND API:                             │
│ POST /users/accounts/cancel-deletion     │
│ Authorization: Bearer <token>            │
└──────────┬───────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ BACKEND PROCESSING:                      │
│ 1. Check deletion_pending status         │
│ 2. Clear deletion timestamp              │
│ 3. Unlock account                        │
│ 4. Cancel scheduled cleanup job          │
│ 5. Send confirmation email               │
└────────────┬─────────────────────────────┘
             ↓
        ✅ DELETION CANCELLED
             ↓
   USER CAN LOGIN AGAIN
   Account is fully active
```

---

## 🎬 COMPLETE FLOW EXAMPLE: "Networking Event Day"

```
┌─────────────────────────────────────────────────────────────────┐
│ MORNING: PREPARATION                                            │
└─────────────────────────────────────────────────────────────────┘

1. USER OPENS APP
   ├─> GET /api/v1 (Check server status)
   └─> Already logged in via token

2. USER VIEWS PROFILE
   ├─> GET /profiles/by-user/:userId (Get my profile)
   ├─> GET /profiles/:id (Get all details)
   └─> Confirms everything is correct

3. USER GENERATES QR CODE
   ├─> GET /profiles/:id/qr-code (Generate QR with profile link)
   └─> Prints/displays QR code for event

4. USER UPLOADS PROFILE PHOTO
   ├─> POST /profiles/:id/upload-photo (Upload new photo)
   └─> ✓ Profile ready

┌─────────────────────────────────────────────────────────────────┐
│ AFTERNOON: AT THE EVENT                                         │
└─────────────────────────────────────────────────────────────────┘

5. PERSON 1 SCANS USER'S QR CODE
   ├─> Person 1's phone gets user's profile UUID
   ├─> POST /contacts/scan (Person 1 creates contact of user)
   └─> Person 1 saved user in their network

6. USER MEETS PERSON 2
   ├─> USER SCANS PERSON 2'S QR CODE
   ├─> POST /contacts/scan (Create contact)
   ├─> Database saves: Contact(name, email, phone from QR)
   └─> Person 2 now in user's network

7. USER MEETS PERSON 3 (WITHOUT APP)
   ├─> Gets business card
   ├─> POST /contacts/upload-business-card (Upload photo)
   ├─> Backend runs OCR (Google Vision API)
   ├─> Extracts: Name, Email, Phone, Company
   ├─> Creates contact automatically
   └─> ✓ Contact added

8. USER MEETS PERSON 4 (HAS CALENDAR INTEGRATION)
   ├─> Conversation leads to future meeting
   ├─> Person 4 shares their events
   ├─> GET /calendar/google/events (Check availability)
   └─> Schedule meeting

┌─────────────────────────────────────────────────────────────────┐
│ EVENING: BACK HOME                                              │
└─────────────────────────────────────────────────────────────────┘

9. USER REVIEWS CONTACTS
   ├─> GET /contacts (List all new contacts)
   ├─> Edits details if needed
   │   └─> PATCH /contacts/:id (Update contact)
   └─> Exports as vCard
       └─> GET /contacts/:id/vcard (Download VCF)

10. USER CREATES FOLLOW-UP CONTACT FORM
    ├─> POST /contact-forms (Create form)
    ├─> Title: "Let's connect on next event"
    └─> Form now receives submissions

11. PERSON 1 VISITS USER'S PROFILE (NO LOGIN)
    ├─> GET /profiles/by-handle/user-handle (Get profile)
    ├─> GET /contact-forms/public/:profileId (Get form)
    ├─> POST /contact-forms/submit/:profileId (Fill form)
    │   Body: { name, email, message }
    └─> ✓ Submission saved

12. USER CHECKS INBOX
    ├─> GET /contact-forms/submissions (Get all submissions)
    ├─> GET /contact-forms/submissions/unread-count (Unread?)
    ├─> Reads Person 1's message
    ├─> PATCH /contact-forms/submissions/:id/mark-read
    └─> Replies or archives

┌─────────────────────────────────────────────────────────────────┐
│ NEXT DAY: FOLLOW-UP                                             │
└─────────────────────────────────────────────────────────────────┘

13. USER SYNCS CALENDAR
    ├─> POST /calendar/google/sync
    │   With date range: "next 3 months"
    ├─> Backend fetches from Google Calendar API
    └─> GET /calendar/google/events (View synced events)

14. USER SENDS EMAILS TO CONTACTS
    ├─> Gets contact emails
    ├─> GET /contacts/:id (Get details)
    └─> Sends via email client (external)

15. USER EXPORTS ALL CONTACTS
    ├─> GET /contacts (List all)
    ├─> For each contact:
    │   └─> GET /contacts/:id/vcard (Export as VCF)
    └─> Shares on team drive
```

---

## 🔄 API INTERACTION DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND (UI)                        │
│  (React Native Mobile / Web App)                             │
└──────────┬───────────────────────────────────────────────────┘
           │
           │ HTTP/REST API Calls
           │ (JSON Data)
           │
    ┌──────▼─────────────────────────────────────────┐
    │                                                │
    │     BACKEND - NestJS Server                    │
    │                                                │
    │  ┌────────────────────────────────────────┐   │
    │  │  Controllers (API Endpoints)           │   │
    │  │  - UsersController                     │   │
    │  │  - ProfilesController                  │   │
    │  │  - ContactsController                  │   │
    │  │  - ContactFormsController              │   │
    │  │  - CalendarController                  │   │
    │  └────────┬─────────────────────────────┘   │
    │           │                                 │
    │  ┌────────▼──────────────────────────────┐   │
    │  │  Services (Business Logic)            │   │
    │  │  - UsersService                       │   │
    │  │  - ProfilesService                    │   │
    │  │  - ContactsService                    │   │
    │  │  - CalendarService                    │   │
    │  │  - OcrService                         │   │
    │  └────────┬──────────────────────────────┘   │
    │           │                                 │
    │  ┌────────▼──────────────────────────────┐   │
    │  │  Repositories (Database Access)      │   │
    │  │  - UserRepository                     │   │
    │  │  - ProfileRepository                  │   │
    │  │  - ContactRepository                  │   │
    │  │  - ContactFormRepository              │   │
    │  └────────┬──────────────────────────────┘   │
    │           │                                 │
    └───────────┼─────────────────────────────────┘
                │
    ┌───────────▼─────────────────────────────────┐
    │          EXTERNAL SERVICES                  │
    │                                             │
    │  ├─> PostgreSQL Database                   │
    │  │   (User, Profile, Contact Data)         │
    │  │                                         │
    │  ├─> Supabase (Auth + Storage)             │
    │  │   ├─> Authentication (JWT)             │
    │  │   └─> File Storage (Images, Files)     │
    │  │                                         │
    │  ├─> Google Vision API                    │
    │  │   (OCR - Extract text from images)     │
    │  │                                         │
    │  └─> Calendar APIs                        │
    │      ├─> Google Calendar API              │
    │      └─> Microsoft Outlook API            │
    │                                             │
    └─────────────────────────────────────────────┘
```

---

## 📊 API CALL FREQUENCY CHART

```
Daily Active User (DAU) Behavior:

┌─────────────────────────────────────┐
│ LOGIN / APP OPEN                    │ 1-2x
│ ├─> GET /api/v1                     │
│ └─> Token validation                │
├─────────────────────────────────────┤
│ PROFILE INTERACTIONS                │ 5-10x
│ ├─> GET /profiles (view)            │
│ ├─> PATCH /profiles (edit)          │
│ └─> GET /profiles/:id/vcard         │
├─────────────────────────────────────┤
│ CONTACT MANAGEMENT                  │ 10-20x
│ ├─> GET /contacts (list)            │
│ ├─> POST /contacts/scan (add)       │
│ ├─> PATCH /contacts/:id (edit)      │
│ └─> DELETE /contacts/:id            │
├─────────────────────────────────────┤
│ CONTACT FORMS                       │ 5-15x
│ ├─> GET /contact-forms/submissions  │
│ ├─> POST /contact-forms/submit      │
│ └─> PATCH submissions/:id (mark)    │
├─────────────────────────────────────┤
│ CALENDAR (if enabled)               │ 2-5x
│ ├─> GET /calendar/status            │
│ ├─> POST /calendar/sync             │
│ └─> GET /calendar/events            │
├─────────────────────────────────────┤
│ FILE OPERATIONS                     │ 1-3x
│ ├─> POST upload                     │
│ ├─> GET files                       │
│ └─> DELETE files                    │
└─────────────────────────────────────┘

Average Daily API Calls per User: ~25-55 calls
```

---

## 🛡️ SECURITY & AUTHENTICATION

### Request Header Pattern (Protected APIs):

```bash
# Every request to protected endpoint needs token:

POST /contacts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Token Validation Flow:

```
Request arrives with token
        ↓
SupabaseAuthGuard checks token
        ↓
Token valid? ──YES──> Extract user ID
              NO ──> Return 401 Unauthorized
        ↓
Attach user to request object
        ↓
Controller receives authenticated user
```

### Rate Limiting:

```
┌────────────────────────┐
│ RATE LIMIT: 100 calls  │
│ Per 15 minutes         │
│ Per IP/User            │
│                        │
│ Exception:             │
│ - Contact Form Submit: │
│   10 calls/day per IP  │
│ (To prevent spam)      │
└────────────────────────┘
```

---

## 🔍 TROUBLESHOOTING - Common Scenarios

### Scenario 1: Token Expired

```
User makes API call
        ↓
Backend returns: 401 Unauthorized
        ↓
Frontend catches error
        ↓
Calls Supabase refresh token endpoint
        ↓
Gets new token
        ↓
Retries original API call ✓
```

### Scenario 2: File Upload Failed

```
User uploads business card
        ↓
File validation fails (too large)
        ↓
Backend returns: 400 Bad Request
│ {
│   "error": "File size exceeds 10MB limit",
│   "maxSize": "10MB"
│ }
        ↓
Frontend shows error message
        ↓
User tries with smaller file ✓
```

### Scenario 3: Contact Form Already Exists

```
User tries to create form
        ↓
Backend checks: User already has form?
        ↓
Yes → Return: 409 Conflict
│ {
│   "error": "Contact form already exists",
│   "formId": "existing-form-uuid"
│ }
        ↓
Frontend offers to edit existing form
```

---

## 📈 Data Model (Quick Reference)

```
USER
├── id (UUID)
├── email (from Supabase Auth)
├── firstName, lastName
├── profileId (foreign key)
├── createdAt, updatedAt

PROFILE
├── id (UUID)
├── userId (foreign key)
├── firstName, lastName, jobTitle, bio
├── profileHandle (unique)
├── deeplinkSlug (unique)
├── isPublic
├── phoneNumbers[] (one-to-many)
├── emails[] (one-to-many)
├── addresses[] (one-to-many)
├── links[] (one-to-many)
├── createdAt, updatedAt

CONTACT
├── id (UUID)
├── userId (foreign key)
├── firstName, lastName, jobTitle, company
├── sourceType (qr_scan, manual, import, etc)
├── phoneNumbers[]
├── emails[]
├── addresses[]
├── links[]
├── businessCardImages[]
├── createdAt, updatedAt

CONTACT_FORM
├── id (UUID)
├── userId (foreign key)
├── profileId (foreign key)
├── title, description
├── fields[] (JSON - dynamic fields)
├── createdAt, updatedAt

CONTACT_SUBMISSION
├── id (UUID)
├── formId (foreign key)
├── profileId (foreign key)
├── visitorName, visitorEmail
├── message, metadata
├── visitorIp, userAgent, referrer
├── read (boolean)
├── createdAt

CALENDAR_CONNECTION
├── id (UUID)
├── userId (foreign key)
├── provider (google/outlook)
├── accessToken (encrypted)
├── refreshToken (encrypted)
├── expiresAt
├── status (connected/disconnected)
├── connectedAt
```

---

## ✅ SUMMARY - All APIs in One Table

| Module | Endpoint | Method | Auth | Description |
|--------|----------|--------|------|-------------|
| **System** | `/api/v1` | GET | ❌ | Check server status |
| **Profiles** | `/profiles` | POST | ✅ | Create profile |
| | `/profiles` | GET | ❌ | List all profiles |
| | `/profiles/:id` | GET | ❌ | Get profile |
| | `/profiles/by-handle/:handle` | GET | ❌ | Get by handle |
| | `/profiles/by-slug/:slug` | GET | ❌ | Get by slug |
| | `/profiles/:id` | PATCH | ✅ | Update profile |
| | `/profiles/:id` | DELETE | ✅ | Delete profile |
| **Contacts** | `/contacts` | POST | ✅ | Create contact |
| | `/contacts` | GET | ✅ | List contacts |
| | `/contacts/:id` | GET | ✅ | Get contact |
| | `/contacts/:id` | PATCH | ✅ | Update contact |
| | `/contacts/:id` | DELETE | ✅ | Delete contact |
| | `/contacts/scan` | POST | ✅ | Scan QR/Badge |
| | `/contacts/upload-business-card` | POST | ✅ | Upload card |
| | `/contacts/import-from-phone` | POST | ✅ | Import contacts |
| **Contact Forms** | `/contact-forms` | POST | ✅ | Create form |
| | `/contact-forms/my-form` | GET | ✅ | Get my form |
| | `/contact-forms/my-form` | PATCH | ✅ | Update form |
| | `/contact-forms/my-form` | DELETE | ✅ | Delete form |
| | `/contact-forms/public/:profileId` | GET | ❌ | Get public form |
| | `/contact-forms/submit/:profileId` | POST | ❌ | Submit form |
| | `/contact-forms/submissions` | GET | ✅ | View submissions |
| | `/contact-forms/submissions/:id` | GET | ✅ | Get submission |
| **Calendar** | `/calendar/connect` | POST | ✅ | Connect calendar |
| | `/calendar/status` | GET | ✅ | Get status |
| | `/calendar/:provider/disconnect` | DELETE | ✅ | Disconnect |
| | `/calendar/:provider/sync` | POST | ✅ | Sync events |
| | `/calendar/:provider/events` | GET | ✅ | Get events |
| **Users** | `/users` | GET | ✅ | List users |
| | `/users/:id` | GET | ✅ | Get user |
| | `/users/:id` | PATCH | ✅ | Update user |
| | `/users/:id` | DELETE | ✅ | Delete user |
| | `/users/files/my-files` | GET | ✅ | Get my files |
| | `/users/files/:fileId` | DELETE | ✅ | Delete file |
| | `/users/accounts/delete` | POST | ✅ | Request delete |
| | `/users/accounts/cancel-deletion` | POST | ✅ | Cancel delete |

---

## 🎓 Conclusion

**Hinglish Summary:**

```
इस backend system मे 5 main features हैं:

1️⃣ PROFILES (Digital Business Card)
   - Apna profile create karo
   - Details add karo (phone, email, etc)
   - QR code generate karo
   - Public/Private banao

2️⃣ CONTACTS (Network Management)
   - QR scan karke contacts add karo
   - Business card upload karke OCR se auto-extract
   - Phone contacts import karo
   - Manage karo

3️⃣ CONTACT FORMS (Lead Generation)
   - Custom form banao
   - Doosre log submit kar sakte hain (public)
   - Submissions inbox mein receive karo
   - Reply dedo

4️⃣ CALENDAR (Event Management)
   - Google Calendar connect karo
   - Events sync karo
   - View karo apne upcoming events
   - Scheduling mein madad

5️⃣ FILES (Storage Management)
   - Photos upload karo
   - Business cards store karo
   - Manage karo

Frontend aur Backend ke beech har action ke liye:
- HTTP Request bhejta hai (method: GET/POST/PATCH/DELETE)
- Backend process karta hai
- JSON response bhejta hai
- Frontend UI update karta hai

Token authentication se security milti hai:
- Login ke baad token milta hai
- Har protected request mein token attach hota hai
- Token expire hote hain aur refresh hote hain
- Rate limiting se abuse prevent hota hai
```

Aaab aap samajh gaye ho ki kaunsa API kaunsa kaam karta hai! 🚀

