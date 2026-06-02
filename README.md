# Sankalp Digital Pathshala Website

A premium full-stack application built for **Sankalp Digital Pathshala** in Salemgarh, Tamkuhi, Kushinagar, Uttar Pradesh. It features offline classroom coaching administration modules integrated with AI doubt-solving assistants.

---

## Technical Architecture

- **Frontend**: Responsive HTML5, Custom HSL Hues CSS3, and Vanilla JavaScript. Features a CSS-only hamburger toggle for device accessibility.
- **Backend**: Express.js server hosted on Vercel Serverless.
- **Database**: MongoDB Atlas using Mongoose connection pooling.
- **AI Integrations**:
  - **Google Gemini 2.5 Flash** for step-by-step math doubt solving and admissions lead readiness scoring.
  - **OpenRouter API** (`openai/gpt-oss-120b:free`) for character-by-character conversational streaming chatbot.
- **Media Upload**: Multer stream parser connected directly to Cloudinary folder allocations.

---

## Directory Layout

```
├── public/                     # Public client assets
│   ├── assets/
│   │   ├── style.css           # Custom variables design system
│   │   └── app.js              # Streaming chatbot, solver hooks & lightbox
│   ├── index.html              # Landing Page
│   ├── about.html              # Chronology legacy (2020-2026)
│   ├── courses.html            # Streams and class syllabus details
│   ├── study-material.html     # Tabbed handouts download triggers
│   ├── test-series.html        # Simulated dashboards and mock structures
│   ├── ai-learning.html        # Homework Doubt Solver submission
│   ├── results.html            # Public watermarked marksheet verify
│   ├── gallery.html            # Lightbox gallery wall
│   ├── faculty.html            # Mentor list
│   ├── faq.html                # Searchable accordion
│   ├── contact.html            # Inquiry form & Maps embed
│   ├── sankalp-sathi.html      # Dedicated chatbot interface
│   ├── enroll.html             # Multi-step counseling forms
│   ├── ai-assistant.html       # Combined solver and schedule generator
│   ├── privacy.html            # Privacy Terms
│   ├── terms.html              # Service Terms
│   ├── admin-login.html        # Admin authentication card
│   ├── admin-dashboard.html    # CRM database summary and updates
│   └── admin-results.html      # Marksheets results CRUD manager
├── server.js                   # Mongoose models, AI calls and protecting middleware
├── vercel.json                 # Vercel Serverless routing config
├── package.json                # Project dependencies
├── .env.example                # Template configuration parameters
└── README.md                   # Instructions
```

---

## Local Setup Instructions

1. Clone or download the directory files.
2. Open terminal inside the root directory and install packages:
   ```bash
   npm install
   ```
3. Create a `.env` file mapping credentials based on the `.env.example` structure:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sankalp
   JWT_SECRET=your_jwt_secret_key
   ADMIN_EMAIL=admin@sankalppathshala.com
   ADMIN_PASSWORD=SankalpAdminPassword2020!
   GEMINI_API_KEY=AIzaSy...
   OPENROUTER_API_KEY=sk-or-v1-...
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```
4. Start the server locally:
   ```bash
   npm start
   ```
5. Open your browser and navigate to: `http://localhost:3000`

---

## Testing API Endpoints

### 1. Contact Form Submit
**URL**: `POST /api/contact`  
**Payload**:
```json
{
  "fullName": "Aman Singh",
  "email": "aman@gmail.com",
  "mobile": "9453961105",
  "subject": "JEE Main Batch enquiry",
  "message": "Please send admission timeline details."
}
```

### 2. Enrollment Lead Scoring
**URL**: `POST /api/lead`  
**Payload**:
```json
{
  "firstName": "Rahul",
  "class": "Class 11 Science",
  "interest": "JEE Advanced",
  "phone": "9453961105",
  "city": "Salemgarh"
}
```
*Calculates enrollment score using Google Gemini, indexing details in AILead model collection.*

### 3. Verify Result Marksheet
**URL**: `POST /api/result/check`  
**Payload**:
```json
{
  "registrationNumber": "SDP-2026-001",
  "dob": "2008-10-15"
}
```

---

## Deployment to Vercel

Simply run:
```bash
vercel
```
Ensure all environment variables listed in `.env.example` are added in the Vercel Project Settings panel.
