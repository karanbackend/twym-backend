# 🎯 Twym Connect - API Status aur Implementation Guide (Hinglish)

**Version:** 1.2 (Phase 1)  
**Date:** December 2025  
**Language:** Hinglish (Hindi + English mix)

---

## 📊 Quick Summary - Kya Kya Ho Gaya Hai?

| Feature | Total APIs | ✅ Done | ❌ Missing | % Complete |
|---------|-----------|---------|------------|------------|
| **Authentication** | 5 | 0 | 5 | 0% ❌ |
| **Profiles** | 17+ | 15 | 2+ | 88% ✅ |
| **Contacts** | 19 | 15 | 4 | 79% ⚠️ |
| **Contact Forms** | 5 | 5 | 0 | 100% ✅ |
| **Calendar** | 7 | 5 | 2 | 71% ⚠️ |
| **QR Codes** | 4 | 2 | 2 | 50% ⚠️ |
| **Account Management** | 2 | 2 | 0 | 100% ✅ |
| **TOTAL** | **59** | **49** | **10** | **83%** |

---

## ✅ PART 1: JO APIs HO GAYE HAIN (Implemented APIs)

### 1. Profile Management APIs (15/17) ✅

**Status:** 88% Complete - Almost sab kuch ho gaya hai!

#### ✅ Implemented APIs:

1. **`POST /profiles`** - Profile create karo
   - User Story: US-P1
   - Kaise kaam karta hai: User form fill karta hai, backend profile create karta hai with handle, QR codes auto-generate hote hain
   - Response: Profile object with id, handle, QR URLs

2. **`GET /profiles`** - Sab profiles list karo (Public)
   - User Story: US-P1a
   - Kaise kaam karta hai: Public profiles dikhaye jaate hain, koi auth nahi chahiye
   - Response: Array of profiles

3. **`GET /profiles/by-user/:userId`** - Apna profile dekho
   - User Story: US-P1
   - Kaise kaam karta hai: User ID se profile fetch hota hai
   - Response: Single profile object

4. **`GET /profiles/by-handle/:profileHandle`** - Handle se profile dekho
   - User Story: US-P1a
   - Kaise kaam karta hai: @username style handle se profile milta hai
   - Response: Profile object

5. **`GET /profiles/by-slug/:slug`** - Slug se profile dekho
   - User Story: US-P1a
   - Kaise kaam karta hai: twym.com/raj-kumar style slug se profile milta hai
   - Response: Profile object

6. **`GET /profiles/:id`** - Profile ID se dekho
   - Response: Profile object

7. **`PATCH /profiles/:id`** - Profile update karo
   - User Story: US-P1, US-P4 (Bio update)
   - Kaise kaam karta hai: Partial update, sirf jo fields bheje wahi update hote hain
   - Response: Updated profile

8. **`PATCH /profiles/:id/visibility`** - Public/Private toggle
   - User Story: US-P9
   - Kaise kaam karta hai: isPublic flag toggle hota hai
   - Response: Updated profile

9. **`DELETE /profiles/:id`** - Profile delete karo
   - Response: Success message

10. **`POST /profiles/:id/profile-image`** - Profile photo upload
    - User Story: US-P3
    - Kaise kaam karta hai: Image file upload, Supabase Storage mein save, URL return
    - Response: File URL

11. **`POST /profiles/:id/cover-image`** - Cover image upload
    - User Story: US-P3
    - Kaise kaam karta hai: Same as profile image
    - Response: File URL

12. **`POST /profiles/:id/emails`** - Email add karo
    - User Story: US-P2
    - Kaise kaam karta hai: Email object create hota hai, primary flag set kar sakte hain
    - Response: Email object

13. **`PATCH /profiles/:id/emails`** - Email update karo
    - User Story: US-P2
    - Response: Updated email

14. **`DELETE /profiles/:id/emails`** - Email delete karo
    - User Story: US-P2
    - Response: Success

15. **`PATCH /profiles/:id/emails/:emailId/primary`** - Primary email set karo
    - User Story: US-P2
    - Kaise kaam karta hai: Ek email ko primary mark karta hai, baaki automatically non-primary ho jaate hain
    - Response: Updated email

16-26. **Phone Numbers, Addresses, Links APIs** - Same pattern as emails
    - POST, PATCH, DELETE, Primary set - sab available hai

27. **`PATCH /profiles/:id/vcard/privacy`** - vCard privacy settings
    - User Story: US-P8
    - Kaise kaam karta hai: include_photo, include_social, include_address flags set karte hain
    - Response: Updated settings

28. **`GET /profiles/:id/vcard/generate`** - vCard generate karo
    - User Story: US-P7
    - Response: vCard file

29. **`GET /profiles/:id/vcard`** - vCard download karo
    - User Story: US-P7
    - Response: .vcf file download

30. **`GET /profiles/handle/:handle/vcard`** - Handle se vCard
    - User Story: US-P7
    - Response: .vcf file

31. **`GET /profiles/:handle/page-qr.png`** - Profile QR code
    - User Story: US-P6, US-Q1
    - Kaise kaam karta hai: QR code image return hota hai, twym.com/{handle} link encode hota hai
    - Response: PNG image

32. **`GET /profiles/:handle/vcard-qr.png`** - vCard QR code
    - User Story: US-P7, US-Q2
    - Kaise kaam karta hai: QR code image return hota hai, vCard download link encode hota hai
    - Response: PNG image

#### ❌ Missing APIs (2):

1. **`POST /profiles/check-handle`** - Handle availability check
   - User Story: US-P1a
   - Kya chahiye: User typing karte waqt live check karna ki handle available hai ya nahi
   - Implementation: Neeche detail mein

2. **`POST /profiles/allocate-handle`** - Handle allocate karo
   - User Story: US-P1a
   - Kya chahiye: Handle reserve karna with collision handling
   - Implementation: Neeche detail mein

---

### 2. Contact Management APIs (15/19) ⚠️

**Status:** 79% Complete - Core features done, kuch missing hai

#### ✅ Implemented APIs:

1. **`POST /contacts`** - Manual contact create
   - User Story: US-C5
   - Kaise kaam karta hai: User manually contact details fill karta hai
   - Response: Contact object

2. **`POST /contacts/scan`** - QR code scan se contact
   - User Story: US-C1, US-C4
   - Kaise kaam karta hai: QR data se profile fetch, contact create with acquired_via=scanned
   - Response: Contact object

3. **`POST /contacts/import-from-phone`** - Phone contacts import
   - User Story: US-C9
   - Kaise kaam karta hai: Phone contacts read-only access, import to Twym database
   - Response: Contact objects array

4. **`POST /contacts/upload-business-card`** - Business card OCR
   - User Story: US-C2, US-C3
   - Kaise kaam karta hai: Image upload → Google Vision OCR → Text extract → Contact create
   - Response: Contact object with OCR data

5. **`POST /contacts/:id/upload-business-card`** - Existing contact ko card add
   - User Story: US-C2
   - Response: Updated contact

6. **`GET /contacts/search`** - Search contacts with filters
   - User Story: US-C8, US-C10, US-C11, US-C12, US-C13
   - Kaise kaam karta hai: Query params se search, filter, sort
   - Query Params: `?q=`, `?sort=`, `?tag=`, `?event=`, `?acquired_via=`, `?pinned=`, `?favorite=`
   - Response: Filtered contacts array

7. **`GET /contacts/deleted`** - Recently deleted contacts
   - User Story: US-C18
   - Response: Deleted contacts array

8. **`GET /contacts`** - List all contacts
   - User Story: US-C10
   - Response: Contacts array

9. **`GET /contacts/:id`** - Contact details
   - Response: Full contact object

10. **`PATCH /contacts/:id`** - Update contact
    - User Story: US-C17 (Notes update)
    - Response: Updated contact

11. **`POST /contacts/:id/tags`** - Tags add karo
    - User Story: US-C14
    - Kaise kaam karta hai: Tags array add hota hai
    - Response: Updated contact

12. **`DELETE /contacts/:id/tags`** - Tags remove karo
    - User Story: US-C14
    - Response: Updated contact

13. **`PATCH /contacts/:id/favorite`** - Favorite toggle
    - User Story: US-C15
    - Kaise kaam karta hai: is_favorite flag toggle
    - Response: Updated contact

14. **`PATCH /contacts/:id/pin`** - Pin toggle
    - User Story: US-C16
    - Kaise kaam karta hai: is_pinned flag toggle, pinned contacts top pe aate hain
    - Response: Updated contact

15. **`PATCH /contacts/:id/notes`** - Notes update
    - User Story: US-C17
    - Kaise kaam karta hai: meeting_notes field update
    - Response: Updated contact

16. **`DELETE /contacts/:id`** - Soft delete
    - User Story: US-C18
    - Kaise kaam karta hai: deleted_at timestamp set, 30 days baad permanent delete
    - Response: Success

17. **`POST /contacts/:id/restore`** - Restore deleted contact
    - User Story: US-C18
    - Response: Restored contact

18-21. **Nested endpoints:** Phone numbers, emails, addresses, links add karo
    - POST endpoints available

#### ❌ Missing APIs (4):

1. **`POST /contacts/lounge/connect`** - Lounge connection
   - User Story: US-C7, US-L2
   - Status: Code commented out hai, service method exists
   - Implementation: Neeche detail mein

2. **`GET /contacts/:id/duplicate-check`** - Duplicate detection
   - User Story: US-C19
   - Kya chahiye: Similar contacts check karna before creating
   - Implementation: Neeche detail mein

3. **Contact filtering verification** - Tags, Event, Acquisition method
   - Status: Code mein hai but verify karna hai
   - Implementation: Testing needed

4. **Sorting verification** - 6 options (date_added, pinned, favorites, tag, scanned, a_to_z)
   - Status: Code mein hai but verify karna hai
   - Implementation: Testing needed

---

### 3. Contact Forms APIs (5/5) ✅

**Status:** 100% Complete - Sab kuch done!

#### ✅ Implemented APIs:

1. **`POST /contact-forms`** - Form create/enable
   - User Story: US-F1
   - Response: Form object

2. **`GET /contact-forms/my-form`** - Apna form dekho
   - User Story: US-F1
   - Response: Form object

3. **`PATCH /contact-forms/my-form`** - Form update
   - User Story: US-F1
   - Response: Updated form

4. **`DELETE /contact-forms/my-form`** - Form disable
   - User Story: US-F1
   - Response: Success

5. **`POST /contact-forms/submit/:profileId`** - Public form submit
   - User Story: US-F2
   - Kaise kaam karta hai: No auth needed, rate limit 10/day per IP
   - Response: Submission object

6. **`GET /contact-forms/public/:profileId`** - Public form dekho
   - User Story: US-F1
   - Response: Form object (public view)

7. **`GET /contact-forms/submissions`** - Submissions list
   - User Story: US-F3
   - Response: Submissions array

8. **`GET /contact-forms/submissions/unread-count`** - Unread count
   - User Story: US-F3
   - Response: Count number

9. **`GET /contact-forms/submissions/:submissionId`** - Single submission
   - User Story: US-F3
   - Response: Submission object

10. **`PATCH /contact-forms/submissions/:submissionId/mark-read`** - Mark read
    - User Story: US-F3, US-F5
    - Response: Updated submission

11. **`POST /contact-forms/submissions/:submissionId/add-to-contacts`** - Add to contacts
    - User Story: US-F4
    - Kaise kaam karta hai: Submission data se contact create, acquired_via=contact_capture_form
    - Response: Contact object

---

### 4. Calendar Integration APIs (5/7) ⚠️

**Status:** 71% Complete - Connection aur sync done, linking missing

#### ✅ Implemented APIs:

1. **`POST /calendar/connect`** - Calendar connect karo
   - User Story: US-K1 (Google), US-K2 (Outlook)
   - Kaise kaam karta hai: OAuth code exchange, tokens store, connection save
   - Response: Connection object

2. **`DELETE /calendar/:provider/disconnect`** - Calendar disconnect
   - User Story: US-K7
   - Kaise kaam karta hai: Tokens delete, connection remove
   - Response: Success

3. **`GET /calendar/status`** - Connection status
   - User Story: US-K1, US-K2
   - Response: Connection status array

4. **`POST /calendar/:provider/sync`** - Events sync karo
   - User Story: US-K3
   - Kaise kaam karta hai: Calendar API se events fetch, cache 15 min, database save
   - Response: Events array

5. **`GET /calendar/:provider/events`** - Events dekho
   - User Story: US-K3
   - Kaise kaam karta hai: Cached events return, 2 years back/forth
   - Response: Events array

#### ❌ Missing APIs (2):

1. **`POST /calendar/link-contact`** - Contact ko event se link karo
   - User Story: US-K4
   - Status: Code commented out hai
   - Implementation: Neeche detail mein

2. **`GET /calendar/contacts/:contactId/events`** - Contact ke linked events
   - User Story: US-K5
   - Status: Code commented out hai
   - Implementation: Neeche detail mein

---

### 5. Account Management APIs (2/2) ✅

**Status:** 100% Complete - Sab done!

#### ✅ Implemented APIs:

1. **`POST /account/delete`** - Account deletion request
   - User Story: US-A7
   - Kaise kaam karta hai: deletion_requested_at set, 30-day grace period, account lock
   - Response: Deletion schedule info

2. **`POST /account/cancel-deletion`** - Deletion cancel
   - User Story: US-A7
   - Kaise kaam karta hai: deletion_requested_at clear, account unlock
   - Response: Success

---

## ❌ PART 2: JO APIs MISSING HAIN (Missing APIs)

### 1. Authentication APIs (0/5) ❌ CRITICAL

**Status:** 0% - Bilkul nahi hai, Phase 1 ke liye CRITICAL!

#### Missing APIs:

1. **`POST /auth/request-otp`** - OTP request karo
   - User Story: US-A1 (Signup), US-A5 (Password Reset)
   - Kya karna hai: Email pe 6-digit OTP send karo
   - Business Rules:
     - Rate limits: 1/min, 3/15min, 10/day per email
     - OTP valid for 10 minutes
     - Purpose: signup ya password_reset

2. **`POST /auth/verify-otp`** - OTP verify karo
   - User Story: US-A1
   - Kya karna hai: OTP code verify, email confirm
   - Business Rules:
     - 3 attempts allowed
     - 10 minutes validity

3. **`POST /auth/set-password`** - Password set karo
   - User Story: US-A2
   - Kya karna hai: OTP verify ke baad password set
   - Business Rules:
     - Password ≥8 characters
     - password_set_at timestamp record

4. **`POST /auth/login`** - Email + Password login
   - User Story: US-A3
   - Kya karna hai: Credentials validate, JWT token return
   - Business Rules:
     - 5 failed attempts = 15-min lockout
     - 10 failed in 24h = force password reset

5. **`POST /auth/signup-oauth`** - OAuth signup
   - User Story: US-A4
   - Kya karna hai: Google/LinkedIn/Microsoft OAuth, profile auto-create
   - Business Rules:
     - No password required
     - oauth_connections table update

---

### 2. Profile Handle APIs (2 Missing) ⚠️

#### Missing APIs:

1. **`POST /profiles/check-handle`** - Handle availability check
   - User Story: US-P1a
   - Kya karna hai: Live typing feedback, available/taken status
   - Response: `{ available: boolean, suggestions: string[] }`

2. **`POST /profiles/allocate-handle`** - Handle allocate karo
   - User Story: US-P1a
   - Kya karna hai: Handle reserve with collision handling
   - Business Rules:
     - 3-30 characters
     - Unique globally
     - Reserved words blocked
     - Collision: add suffix (-2, -3, etc)

---

### 3. Contact Lounge API (1 Missing) ⚠️

#### Missing API:

1. **`POST /contacts/lounge/connect`** - Lounge connection
   - User Story: US-C7, US-L2
   - Status: Service method exists, controller commented out
   - Kya karna hai: Uncomment and test
   - Business Rules:
     - Mutual contact creation (both users)
     - Tag with event name
     - Notify both users

---

### 4. Calendar Linking APIs (2 Missing) ⚠️

#### Missing APIs:

1. **`POST /calendar/link-contact`** - Contact ko event se link
   - User Story: US-K4
   - Status: Code commented out
   - Kya karna hai: Uncomment and test
   - Business Rules:
     - Contact-event relationship save
     - "Met at [Event Name]" tag add

2. **`GET /calendar/contacts/:contactId/events`** - Contact ke events
   - User Story: US-K5
   - Status: Code commented out
   - Kya karna hai: Uncomment and test
   - Business Rules:
     - Linked events return
     - Manual link ya email match

---

## 🛠️ PART 3: KAISE IMPLEMENT KARENGE (Implementation Guide)

### Priority 1: Authentication APIs (CRITICAL) 🔴

#### API 1: `POST /auth/request-otp`

**User Story (US-A1):**
```
User ne email signup kiya
→ Email enter kiya
→ "Send OTP" button click
→ 6-digit code email pe aaya
→ User code enter karta hai
→ Email verified
```

**UI Flow:**
1. User signup screen pe email enter karta hai
2. "Send OTP" button click
3. Loading state: "Sending OTP..."
4. Success: "OTP sent to your email"
5. OTP input field appear
6. User code enter karta hai
7. "Verify" button click

**Backend Implementation:**

```typescript
// src/core/auth/auth.controller.ts (NEW FILE)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for signup/password reset' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    // Rate limit check
    await this.otpService.checkRateLimit(dto.email, dto.purpose);
    
    // Generate 6-digit OTP
    const otp = this.otpService.generateOtp();
    
    // Save to database (otp_send_events table)
    await this.otpService.saveOtpEvent(dto.email, otp, dto.purpose);
    
    // Send email via Supabase or email service
    await this.authService.sendOtpEmail(dto.email, otp);
    
    return { message: 'OTP sent successfully' };
  }
}
```

**Database Schema:**
```sql
-- otp_send_events table
CREATE TABLE otp_send_events (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL, -- 'signup' or 'password_reset'
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit check query
SELECT COUNT(*) 
FROM otp_send_events 
WHERE email = $1 
  AND created_at > NOW() - INTERVAL '1 minute';
```

**Service Implementation:**
```typescript
// src/core/auth/otp.service.ts
@Injectable()
export class OtpService {
  async checkRateLimit(email: string, purpose: string) {
    // Check 1/min
    const lastMinute = await this.repo.count({
      where: {
        email,
        createdAt: MoreThan(subMinutes(new Date(), 1))
      }
    });
    if (lastMinute >= 1) throw new TooManyRequestsException('1 request per minute');
    
    // Check 3/15min
    const last15Min = await this.repo.count({
      where: {
        email,
        createdAt: MoreThan(subMinutes(new Date(), 15))
      }
    });
    if (last15Min >= 3) throw new TooManyRequestsException('3 requests per 15 minutes');
    
    // Check 10/day
    const today = await this.repo.count({
      where: {
        email,
        createdAt: MoreThan(startOfDay(new Date()))
      }
    });
    if (today >= 10) throw new TooManyRequestsException('10 requests per day');
  }
  
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
```

---

#### API 2: `POST /auth/verify-otp`

**User Story (US-A1):**
```
User ne OTP code enter kiya
→ Code verify hua
→ Email confirmed
→ Next step: Password set
```

**UI Flow:**
1. OTP input field
2. User 6 digits enter karta hai
3. "Verify" button click
4. Loading: "Verifying..."
5. Success: "Email verified! Set your password"

**Backend Implementation:**

```typescript
@Post('verify-otp')
@ApiOperation({ summary: 'Verify OTP code' })
async verifyOtp(@Body() dto: VerifyOtpDto) {
  // Find OTP event
  const otpEvent = await this.otpService.findOtpEvent(
    dto.email, 
    dto.code,
    dto.purpose
  );
  
  if (!otpEvent) {
    throw new BadRequestException('Invalid OTP');
  }
  
  // Check expiry (10 minutes)
  if (otpEvent.expiresAt < new Date()) {
    throw new BadRequestException('OTP expired');
  }
  
  // Check attempts (max 3)
  if (otpEvent.attempts >= 3) {
    throw new BadRequestException('Too many attempts');
  }
  
  // Increment attempts
  await this.otpService.incrementAttempts(otpEvent.id);
  
  // Verify via Supabase Auth
  if (dto.purpose === 'signup') {
    await this.supabase.auth.verifyOtp({
      email: dto.email,
      token: dto.code,
      type: 'signup'
    });
  }
  
  return { 
    verified: true,
    nextStep: 'set-password' // For signup
  };
}
```

---

#### API 3: `POST /auth/set-password`

**User Story (US-A2):**
```
OTP verify ke baad
→ Password set screen
→ User password enter karta hai (8+ chars)
→ Password saved
→ Account creation complete
```

**UI Flow:**
1. Password input field
2. Confirm password field
3. "Set Password" button
4. Validation: min 8 chars
5. Success: "Account created! Logging in..."

**Backend Implementation:**

```typescript
@Post('set-password')
@ApiOperation({ summary: 'Set password after OTP verification' })
async setPassword(@Body() dto: SetPasswordDto) {
  // Validate password (8+ chars)
  if (dto.password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters');
  }
  
  // Verify OTP first
  await this.verifyOtp({
    email: dto.email,
    code: dto.otp_code,
    purpose: 'signup'
  });
  
  // Update Supabase Auth user password
  const { data, error } = await this.supabase.auth.updateUser({
    password: dto.password
  });
  
  if (error) throw new BadRequestException(error.message);
  
  // Update users table
  await this.usersService.updatePasswordSetAt(dto.email);
  
  return { 
    message: 'Password set successfully',
    userId: data.user.id
  };
}
```

---

#### API 4: `POST /auth/login`

**User Story (US-A3):**
```
User ne email + password enter kiya
→ Login button click
→ Credentials validate
→ JWT token mila
→ User logged in
```

**UI Flow:**
1. Email input
2. Password input
3. "Login" button
4. Loading: "Logging in..."
5. Success: Redirect to home

**Backend Implementation:**

```typescript
@Post('login')
@ApiOperation({ summary: 'Login with email and password' })
async login(@Body() dto: LoginDto) {
  // Check failed login attempts
  const failedAttempts = await this.authService.getFailedAttempts(dto.email);
  
  if (failedAttempts >= 5) {
    // 15-min lockout
    const lockoutUntil = await this.authService.getLockoutUntil(dto.email);
    if (lockoutUntil > new Date()) {
      throw new ForbiddenException('Account locked. Try again later.');
    }
  }
  
  if (failedAttempts >= 10) {
    // Force password reset
    throw new ForbiddenException('Too many failed attempts. Please reset password.');
  }
  
  // Authenticate via Supabase
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email: dto.email,
    password: dto.password
  });
  
  if (error) {
    // Record failed attempt
    await this.authService.recordFailedAttempt(dto.email);
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Clear failed attempts
  await this.authService.clearFailedAttempts(dto.email);
  
  return {
    access_token: data.session.access_token,
    user: data.user
  };
}
```

---

#### API 5: `POST /auth/signup-oauth`

**User Story (US-A4):**
```
User ne "Sign in with Google" click kiya
→ OAuth flow start
→ Google login
→ Profile auto-create
→ User logged in (no password needed)
```

**UI Flow:**
1. "Sign in with Google" button
2. OAuth redirect to Google
3. User Google login
4. Callback to app
5. Profile auto-created
6. User logged in

**Backend Implementation:**

```typescript
@Post('signup-oauth')
@ApiOperation({ summary: 'OAuth signup (Google, LinkedIn, Microsoft)' })
async signupOAuth(@Body() dto: OAuthSignupDto) {
  // Exchange OAuth code for tokens
  const tokens = await this.oauthService.exchangeCode(
    dto.provider,
    dto.code,
    dto.redirectUri
  );
  
  // Get user info from provider
  const userInfo = await this.oauthService.getUserInfo(
    dto.provider,
    tokens.access_token
  );
  
  // Create/update Supabase user
  const { data: authData } = await this.supabase.auth.signInWithOAuth({
    provider: dto.provider,
    options: {
      redirectTo: dto.redirectUri
    }
  });
  
  // Save OAuth connection
  await this.oauthService.saveConnection(
    authData.user.id,
    dto.provider,
    tokens
  );
  
  // Auto-create profile
  await this.profilesService.createFromOAuth(
    authData.user.id,
    userInfo
  );
  
  return {
    access_token: authData.session.access_token,
    user: authData.user,
    profile_created: true
  };
}
```

---

### Priority 2: Profile Handle APIs ⚠️

#### API 1: `POST /profiles/check-handle`

**User Story (US-P1a):**
```
User profile create karte waqt handle enter karta hai
→ Typing karte waqt live check: "Available" ya "Taken"
→ Agar taken, suggestions dikhaye
```

**UI Flow:**
1. Handle input field
2. User typing: "john-smith"
3. Live API call (debounced)
4. Response: "✓ Available" ya "✗ Taken, try: john-smith-2"
5. Suggestions dropdown

**Backend Implementation:**

```typescript
// src/core/profiles/profiles.controller.ts
@Post('check-handle')
@ApiOperation({ summary: 'Check handle availability' })
async checkHandle(@Body() dto: CheckHandleDto) {
  const normalized = this.normalizeHandle(dto.handle);
  
  // Validate
  if (normalized.length < 3 || normalized.length > 30) {
    throw new BadRequestException('Handle must be 3-30 characters');
  }
  
  // Check reserved words
  if (this.isReserved(normalized)) {
    throw new BadRequestException('Handle is reserved');
  }
  
  // Check profanity
  if (this.isProfane(normalized)) {
    throw new BadRequestException('Handle not available');
  }
  
  // Check database
  const exists = await this.profilesService.handleExists(normalized);
  
  if (exists) {
    // Generate suggestions
    const suggestions = await this.generateSuggestions(normalized);
    return {
      available: false,
      suggestions
    };
  }
  
  return {
    available: true,
    suggestions: []
  };
}

private normalizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Only a-z, 0-9, -
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, ''); // Trim hyphens
}

private async generateSuggestions(base: string): Promise<string[]> {
  const suggestions = [];
  for (let i = 2; i <= 10; i++) {
    const candidate = `${base}-${i}`;
    const exists = await this.profilesService.handleExists(candidate);
    if (!exists) {
      suggestions.push(candidate);
      if (suggestions.length >= 3) break;
    }
  }
  return suggestions;
}
```

---

#### API 2: `POST /profiles/allocate-handle`

**User Story (US-P1a):**
```
User ne handle select kiya
→ "Allocate Handle" button click
→ Handle reserve ho gaya
→ Profile creation continue
```

**UI Flow:**
1. User handle select karta hai
2. "Continue" button click
3. Handle allocate API call
4. Handle reserved
5. Profile creation form continue

**Backend Implementation:**

```typescript
@Post('allocate-handle')
@ApiOperation({ summary: 'Allocate handle with collision handling' })
async allocateHandle(@Body() dto: AllocateHandleDto) {
  let candidate = this.normalizeHandle(dto.desired_handle || dto.auto_generate);
  
  // Try base handle first
  let allocated = await this.tryAllocate(candidate);
  
  if (!allocated) {
    // Try with suffix
    for (let i = 2; i <= 99; i++) {
      candidate = `${this.normalizeHandle(dto.desired_handle)}-${i}`;
      allocated = await this.tryAllocate(candidate);
      if (allocated) break;
    }
  }
  
  if (!allocated) {
    // Try with random suffix
    const random = Math.random().toString(36).substring(2, 6);
    candidate = `${this.normalizeHandle(dto.desired_handle)}-${random}`;
    allocated = await this.tryAllocate(candidate);
  }
  
  if (!allocated) {
    throw new BadRequestException('Unable to allocate handle');
  }
  
  // Generate deeplink slug
  const slug = candidate;
  const deeplinkUrl = `${this.appConfig.frontendUrl}/${slug}`;
  
  return {
    handle: candidate,
    deeplink_slug: slug,
    deeplink_url: deeplinkUrl,
    status: 'allocated'
  };
}

private async tryAllocate(handle: string): Promise<boolean> {
  try {
    // Try to insert (will fail if exists due to UNIQUE constraint)
    await this.profilesService.reserveHandle(handle);
    return true;
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return false;
    }
    throw error;
  }
}
```

---

### Priority 3: Contact Lounge API ⚠️

#### API: `POST /contacts/lounge/connect`

**User Story (US-C7, US-L2):**
```
Event lounge mein dono users connected
→ User A ne User B ko "Connect" button click kiya
→ Mutual contacts create ho gaye
→ Dono ko notification aaya
```

**UI Flow:**
1. Event lounge screen
2. Participant list dikhaye
3. User B ke saamne "Connect" button
4. User A click karta hai
5. Loading: "Connecting..."
6. Success: "Connected! Contact added"
7. Notification: "User A connected with you"

**Backend Implementation:**

```typescript
// src/core/contacts/contacts.controller.ts
// UNCOMMENT THIS CODE:

@Post('lounge/connect')
@ApiOperation({ summary: 'Create mutual contacts from lounge connection' })
async createLoungeConnection(
  @Body() dto: {
    user_id: string;
    lounge_session_id: string;
    event_id?: string;
  },
  @CurrentAuthUser() user: AuthUser,
) {
  return this.contactsService.createLoungeConnection(
    user.id,
    dto.user_id,
    dto.lounge_session_id,
    dto.event_id,
  );
}
```

**Service Method (Already exists):**
```typescript
// src/core/contacts/contacts.service.ts
async createLoungeConnection(
  ownerId: string,
  targetUserId: string,
  loungeSessionId: string,
  eventId?: string,
) {
  // Get target user's profile
  const targetProfile = await this.profilesService.findByUserId(targetUserId);
  if (!targetProfile) {
    throw new NotFoundException('Target user profile not found');
  }
  
  // Create contact for owner (User A gets User B's contact)
  const contact1 = await this.create({
    // ... map from targetProfile
    acquired_via: ACQUIRED_VIA.LOUNGE,
    lounge_session_id: loungeSessionId,
    event_id: eventId,
    automatic_tags: eventId ? [`Event: ${eventName}`] : [],
  }, ownerId);
  
  // Get owner's profile
  const ownerProfile = await this.profilesService.findByUserId(ownerId);
  
  // Create contact for target (User B gets User A's contact)
  const contact2 = await this.create({
    // ... map from ownerProfile
    acquired_via: ACQUIRED_VIA.LOUNGE,
    lounge_session_id: loungeSessionId,
    event_id: eventId,
    automatic_tags: eventId ? [`Event: ${eventName}`] : [],
  }, targetUserId);
  
  // Notify both users
  await this.notificationService.sendLoungeConnectionNotification(
    ownerId,
    targetUserId
  );
  
  return {
    contact_created: true,
    my_contact_id: contact1.id,
    their_contact_id: contact2.id
  };
}
```

---

### Priority 4: Calendar Linking APIs ⚠️

#### API 1: `POST /calendar/link-contact`

**User Story (US-K4):**
```
User ne calendar event select kiya
→ "Link Contact" button click
→ Contact search/select
→ Contact event se link ho gaya
→ Contact pe "Met at [Event]" tag add
```

**UI Flow:**
1. Calendar event detail screen
2. "Link Contact" button
3. Contact search modal
4. User contact select karta hai
5. "Link" button click
6. Success: "Contact linked to event"

**Backend Implementation:**

```typescript
// src/common/calendar/calendar.controller.ts
// UNCOMMENT THIS CODE:

@Post('link-contact')
@ApiOperation({ summary: 'Link contact to calendar event' })
@ApiBody({ type: LinkContactToEventDto })
async linkContact(
  @CurrentAuthUser() user: { id: string }, 
  @Body() dto: LinkContactToEventDto
) {
  return this.calendarService.linkContactToEvent(user.id, dto);
}
```

**Service Implementation:**
```typescript
// src/common/calendar/calendar.service.ts
async linkContactToEvent(
  userId: string,
  dto: { contact_id: string; event_id: string; provider: CalendarProvider }
) {
  // Verify contact belongs to user
  const contact = await this.contactsService.findOne(
    dto.contact_id,
    userId
  );
  
  // Get event details
  const event = await this.getEvent(
    userId,
    dto.provider,
    dto.event_id
  );
  
  // Create link in database (new table: contact_event_links)
  await this.contactEventLinksRepo.save({
    contact_id: dto.contact_id,
    event_id: dto.event_id,
    provider: dto.provider,
    event_title: event.title,
    event_date: event.startTime,
    linked_at: new Date()
  });
  
  // Add tag to contact
  await this.contactsService.addTags(
    dto.contact_id,
    userId,
    [`Met at ${event.title}`]
  );
  
  return {
    linked: true,
    contact_id: dto.contact_id,
    event_id: dto.event_id
  };
}
```

**Database Schema:**
```sql
CREATE TABLE contact_event_links (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  event_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google' or 'microsoft'
  event_title VARCHAR(255),
  event_date TIMESTAMPTZ,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, event_id, provider)
);
```

---

#### API 2: `GET /calendar/contacts/:contactId/events`

**User Story (US-K5):**
```
Contact detail screen pe
→ "Past Events" section
→ Linked events dikhaye
→ Event name, date, organizer, venue
```

**UI Flow:**
1. Contact detail screen
2. "Past Events" tab
3. Linked events list
4. Each event: name, date, organizer, venue

**Backend Implementation:**

```typescript
// src/common/calendar/calendar.controller.ts
// UNCOMMENT THIS CODE:

@Get('contacts/:contactId/events')
@ApiOperation({ summary: 'Get contact events' })
async getContactEvents(
  @CurrentAuthUser() user: { id: string },
  @Param('contactId') contactId: string
) {
  return this.calendarService.getContactEvents(user.id, contactId);
}
```

**Service Implementation:**
```typescript
async getContactEvents(userId: string, contactId: string) {
  // Get linked events from database
  const links = await this.contactEventLinksRepo.find({
    where: { contact_id: contactId }
  });
  
  // Also check email matching
  const contact = await this.contactsService.findOne(contactId, userId);
  const contactEmails = contact.emails.map(e => e.email);
  
  // Find events where contact email matches attendee
  const emailMatchedEvents = await this.findEventsByAttendeeEmail(
    userId,
    contactEmails
  );
  
  // Combine and return
  return {
    linked_events: links.map(link => ({
      event_id: link.event_id,
      provider: link.provider,
      title: link.event_title,
      date: link.event_date,
      linked_at: link.linked_at
    })),
    email_matched_events: emailMatchedEvents
  };
}
```

---

## 📋 PART 4: IMPLEMENTATION CHECKLIST

### Phase 1 Complete Checklist

#### ✅ Already Done:
- [x] Profile CRUD (create, read, update, delete)
- [x] Profile contact info (emails, phones, addresses, links)
- [x] Profile images (photo, cover)
- [x] QR codes (profile, vCard)
- [x] Contact CRUD
- [x] Contact search & filter
- [x] Contact tags, favorite, pin
- [x] Business card OCR
- [x] Contact forms (create, submit, inbox)
- [x] Calendar connect & sync
- [x] Account deletion

#### ⚠️ Need to Complete:
- [ ] **Auth APIs (5)** - CRITICAL
  - [ ] POST /auth/request-otp
  - [ ] POST /auth/verify-otp
  - [ ] POST /auth/set-password
  - [ ] POST /auth/login
  - [ ] POST /auth/signup-oauth

- [ ] **Profile Handle APIs (2)**
  - [ ] POST /profiles/check-handle
  - [ ] POST /profiles/allocate-handle

- [ ] **Contact Lounge API (1)**
  - [ ] POST /contacts/lounge/connect (uncomment & test)

- [ ] **Calendar Linking APIs (2)**
  - [ ] POST /calendar/link-contact (uncomment & test)
  - [ ] GET /calendar/contacts/:contactId/events (uncomment & test)

#### ❌ Not in Phase 1:
- [ ] Event creation & management (Phase 2)
- [ ] QR scan tracking & analytics (Phase 2)
- [ ] Phone contact sync to database (Phase 2)
- [ ] Handle rename with redirect (Phase 2)

---

## 🎯 NEXT STEPS - Implementation Order

### Week 1: Authentication (CRITICAL)
1. Day 1-2: OTP request & verify APIs
2. Day 3: Set password API
3. Day 4: Login API
4. Day 5: OAuth signup API
5. Testing & integration

### Week 2: Remaining APIs
1. Day 1: Profile handle APIs (check & allocate)
2. Day 2: Lounge connection API (uncomment & test)
3. Day 3: Calendar linking APIs (uncomment & test)
4. Day 4-5: Testing, bug fixes, documentation

---

## 📞 Summary

**Total APIs:** 59  
**Done:** 49 (83%)  
**Missing:** 10 (17%)

**Critical Missing:**
1. Authentication APIs (5) - **MUST DO FIRST**
2. Profile handle APIs (2) - High priority
3. Lounge connection (1) - Medium priority
4. Calendar linking (2) - Medium priority

**Sabse pehle Authentication APIs implement karo kyunki bina iske users signup/login nahi kar sakte!**

---

**Last Updated:** December 2025  
**Status:** 83% Complete  
**Next Focus:** Authentication APIs implementation

