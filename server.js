const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { z } = require('zod');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security Configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://generativelanguage.googleapis.com", "https://openrouter.ai"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit admin login attempts to 5 per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit AI requests to 20 per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait a few minutes before trying again.' }
});

// Serve static assets from public/assets and HTML from public/
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use(express.static(path.join(__dirname, 'public')));

// Multer configurations for file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cache database connection for Serverless Vercel environment
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState >= 1;
    console.log('MongoDB connection initialized successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed. Please check backend logs.' });
  }
});

// --- MONGOOSE MODELS ---

// 1. Inquiry Model
const InquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', InquirySchema);

// 2. AILead Model
const AILeadSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  class: { type: String, required: true },
  interest: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  parentName: { type: String },
  email: { type: String },
  aiSummary: { type: String },
  leadScore: { type: Number, default: 50 },
  status: { type: String, enum: ['pending', 'contacted', 'converted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const AILead = mongoose.model('AILead', AILeadSchema);

// 3. AIQuestion Model
const AIQuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'pdf'], required: true },
  question: { type: String },
  answer: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const AIQuestion = mongoose.model('AIQuestion', AIQuestionSchema);

// 4. Result Model
const ResultSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  dob: { type: String, required: true }, // Format: YYYY-MM-DD
  photo: { type: String }, // Cloudinary Image URL
  grade: { type: String, required: true }, // e.g. A+, 95%
  remarks: { type: String },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const Result = mongoose.model('Result', ResultSchema);

// 5. Event Model
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  image: { type: String }, // Cloudinary Image URL
  createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', EventSchema);

// 6. Gallery Model
const GallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Gallery = mongoose.model('Gallery', GallerySchema);

// 7. Program Model
const ProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Foundation, Academic, Secondary, Competitive, Future Skills
  description: { type: String, required: true },
  features: [{ type: String }],
  image: { type: String }, // Image URL or SVG
  createdAt: { type: Date, default: Date.now }
});
const Program = mongoose.model('Program', ProgramSchema);

// --- AUTH MIDDLEWARE ---
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// --- HELPER FUNCTIONS FOR CLOUDINARY UPLOADS ---
const uploadToCloudinary = (fileBuffer, folder = 'sankalp_pathshala') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// --- PUBLIC API ROUTES ---

// Submit Contact Inquiry
app.post('/api/contact', apiLimiter, async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    mobile: z.string().min(10).max(15),
    subject: z.string().min(3),
    message: z.string().min(5)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid inquiry data. Please check all fields.' });
  }

  try {
    const inquiry = new Inquiry(parsed.data);
    await inquiry.save();
    res.status(201).json({ message: 'Thank you! Your inquiry has been submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while saving your inquiry. Please try again.' });
  }
});

// Capture Admissions Lead with AI Summary & Score
app.post('/api/lead', apiLimiter, async (req, res) => {
  const schema = z.object({
    firstName: z.string().min(1),
    class: z.string().min(1),
    interest: z.string().min(1),
    phone: z.string().min(10).max(15),
    city: z.string().min(1),
    parentName: z.string().optional(),
    email: z.string().email().optional().or(z.literal(''))
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid enrollment data. Please check all fields.' });
  }

  const { firstName, class: studentClass, interest, phone, city, parentName, email } = parsed.data;

  // Run AI Summary & Scoring using Gemini
  let aiSummary = `Interested in ${interest} for class ${studentClass}. Contact number: ${phone}. Located in ${city}.`;
  let leadScore = 50;

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this admission inquiry for Sankalp Digital Pathshala:
              Name: ${firstName}
              Class: ${studentClass}
              Interest: ${interest}
              Phone: ${phone}
              City: ${city}
              Parent Name: ${parentName || 'Not Provided'}
              Email: ${email || 'Not Provided'}
              
              Calculate an enrollment readiness/lead score from 0 to 100.
              Score rules:
              - Higher score if the lead is local to Salemgarh, Tamkuhi, Kushinagar, or Uttar Pradesh.
              - Higher score if parent name or email is supplied.
              - Higher score if class is competitive (Class 10, 11, 12, JEE, NEET).
              
              Provide the response strictly in the following JSON format:
              {
                "summary": "2-3 sentences summarizing the profile and follow-up advice.",
                "score": 85
              }
              Do not include markdown wrappers, return only the JSON raw string.`
            }]
          }]
        })
      });

      if (response.ok) {
        const result = await response.json();
        const responseText = result.candidates[0].content.parts[0].text;
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanedJson);
        aiSummary = aiData.summary || aiSummary;
        leadScore = Number(aiData.score) || leadScore;
      }
    } catch (error) {
      console.error('Gemini lead scoring failed:', error.message);
    }
  }

  try {
    const newLead = new AILead({
      firstName,
      class: studentClass,
      interest,
      phone,
      city,
      parentName,
      email,
      aiSummary,
      leadScore
    });
    await newLead.save();
    res.status(201).json({ message: 'Enrollment inquiry received! Our representative will call you shortly.', score: leadScore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record enrollment lead. Please try again.' });
  }
});

// AI Question Solver
app.post('/api/solve-question', aiLimiter, upload.single('file'), async (req, res) => {
  const { question, type } = req.body;
  
  if (!question && !req.file) {
    return res.status(400).json({ error: 'Please enter a question or upload a file.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini AI service is currently unavailable.' });
  }

  try {
    const parts = [];
    parts.push({ text: question || "Solve this academic question step-by-step with clear explanations." });

    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error status:', response.status, errText);
      return res.status(500).json({ error: 'AI Question Solver API encountered an error.' });
    }

    const result = await response.json();
    const answer = result.candidates[0].content.parts[0].text;

    // Log the solved question in the DB for stats
    const questionLog = new AIQuestion({
      type: req.file ? (req.file.mimetype.includes('pdf') ? 'pdf' : 'image') : 'text',
      question: question || `Uploaded file: ${req.file.originalname}`,
      answer
    });
    await questionLog.save();

    res.json({ answer });
  } catch (error) {
    console.error('AI Question Solver crashed:', error.message);
    res.status(500).json({ error: 'Something went wrong while processing your request. Please try again.' });
  }
});

// Streaming Chatbot via OpenRouter
app.post('/api/chat', aiLimiter, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array.' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'Chatbot service is currently unavailable.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemMessage = {
    role: 'system',
    content: `You are Sankalp Sathi, the friendly and knowledgeable AI mentor of Sankalp Digital Pathshala, a premium offline coaching institute founded in 2020 by Dr. Arvind Sharma, located in Salemgarh, Tamkuhi, Kushinagar, Uttar Pradesh. We provide expert classroom programs for classes 6-12, JEE Main & Advanced, NEET, Commerce, Humanities, and Future Skills (AI, Robotics, Coding). Our faculty includes IITians, NITians, and Ph.D. holders. We use smart classrooms, premium printed study materials, weekly tests, AI-powered performance analytics, and a 24/7 AI doubt solver. We have mentored 1500+ students with a 98% success rate.

Our mission is to deliver premium offline education enhanced by AI, ensuring every student achieves academic excellence. We also run Rojgaar Buddy and community programs. Contact us at +91 9453961105 or info@sankalppathshala.com. Working hours: Mon-Sat 8 AM-8 PM, Sun 9 AM-2 PM.

This AI assistant was developed by NexGenAiTech (developer: Jahid, contact: +91 8055698328, website: https://nexgenaitech.online).

Response rules: Use plain paragraphs only, no markdown, no special formatting. Keep a warm, friendly, and encouraging tone. You may respond in Hindi, English, or Hinglish as the user prefers. When someone shows interest in admissions, gently collect their name, class, interest, phone, and city so our team can follow up.`
  };

  const fullMessages = [systemMessage, ...messages];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://www.sankalpdigitalpathshala.online',
        'X-Title': 'Sankalp Digital Pathshala'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: fullMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error status:', response.status, errText);
      res.write(`data: ${JSON.stringify({ error: 'Chatbot streaming error.' })}\n\n`);
      return res.end();
    }

    const reader = response.body;
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response body received.' })}\n\n`);
      return res.end();
    }

    // Proxy the stream chunks to the client
    reader.on('data', (chunk) => {
      res.write(chunk);
    });

    reader.on('end', () => {
      res.end();
    });

    reader.on('error', (err) => {
      console.error('Stream processing error:', err.message);
      res.end();
    });

  } catch (error) {
    console.error('OpenRouter stream proxy crashed:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'AI service crashed.' })}\n\n`);
    res.end();
  }
});

// Result Checker
app.post('/api/result/check', apiLimiter, async (req, res) => {
  const { registrationNumber, dob } = req.body;
  if (!registrationNumber || !dob) {
    return res.status(400).json({ error: 'Registration Number and Date of Birth are required.' });
  }

  try {
    const result = await Result.findOne({
      registrationNumber: registrationNumber.trim(),
      dob: dob.trim(),
      published: true
    });

    if (!result) {
      return res.status(404).json({ error: 'No active student record found with these details.' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error checking exam results.' });
  }
});

// List Public Programs
app.get('/api/public/programs', async (req, res) => {
  try {
    const programs = await Program.find().sort({ createdAt: -1 });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve classroom programs.' });
  }
});

// List Public Gallery Images
app.get('/api/public/gallery', async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve gallery photos.' });
  }
});

// List Public Events
app.get('/api/public/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve institute events.' });
  }
});

// --- ADMIN API ROUTES (Protected) ---

// Admin Login
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    return res.json({ success: true, message: 'Welcome back, Admin.' });
  }

  res.status(401).json({ error: 'Invalid administrator email or password.' });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Check Auth Status
app.get('/api/admin/check-auth', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// Admin Dashboard Summary Statistics
app.get('/api/admin/dashboard', isAuthenticated, async (req, res) => {
  try {
    const leadsCount = await AILead.countDocuments();
    const inquiriesCount = await Inquiry.countDocuments();
    const resultsCount = await Result.countDocuments();
    const solvedCount = await AIQuestion.countDocuments();
    const galleryCount = await Gallery.countDocuments();

    // Get counts for chat interactions (using text type log as proxy)
    const textSolverCount = await AIQuestion.countDocuments({ type: 'text' });
    const imageSolverCount = await AIQuestion.countDocuments({ type: 'image' });
    const pdfSolverCount = await AIQuestion.countDocuments({ type: 'pdf' });

    res.json({
      leads: leadsCount,
      inquiries: inquiriesCount,
      results: resultsCount,
      aiQuestions: solvedCount,
      gallery: galleryCount,
      details: {
        textSolves: textSolverCount,
        imageSolves: imageSolverCount,
        pdfSolves: pdfSolverCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

// Inquiry CRM Operations
app.get('/api/admin/inquiries', isAuthenticated, async (req, res) => {
  try {
    const list = await Inquiry.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load inquiries.' });
  }
});

app.patch('/api/admin/inquiries/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await Inquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry status.' });
  }
});

app.delete('/api/admin/inquiries/:id', isAuthenticated, async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Inquiry removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

// Leads CRM Operations
app.get('/api/admin/leads', isAuthenticated, async (req, res) => {
  try {
    const list = await AILead.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load enrollment leads.' });
  }
});

app.patch('/api/admin/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const item = await AILead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead status.' });
  }
});

app.delete('/api/admin/leads/:id', isAuthenticated, async (req, res) => {
  try {
    await AILead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead record removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead.' });
  }
});

// Results CRUD Operations (Includes student photo upload)
app.get('/api/admin/results', isAuthenticated, async (req, res) => {
  try {
    const list = await Result.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list exam results.' });
  }
});

app.post('/api/admin/results', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    let photoUrl = '';
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.buffer, 'sankalp_results');
    }

    const { registrationNumber, studentName, fatherName, dob, grade, remarks, published } = req.body;

    const record = new Result({
      registrationNumber: registrationNumber.trim(),
      studentName,
      fatherName,
      dob,
      photo: photoUrl,
      grade,
      remarks,
      published: published === 'true' || published === true
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A student record with this Registration Number already exists.' });
    }
    res.status(500).json({ error: 'Failed to create student result.' });
  }
});

app.put('/api/admin/results/:id', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.published) {
      updateData.published = updateData.published === 'true' || updateData.published === true;
    }
    
    if (req.file) {
      updateData.photo = await uploadToCloudinary(req.file.buffer, 'sankalp_results');
    }

    const record = await Result.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student result.' });
  }
});

app.delete('/api/admin/results/:id', isAuthenticated, async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student result deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student result.' });
  }
});

// Event CRUD Operations
app.get('/api/admin/events', isAuthenticated, async (req, res) => {
  try {
    const list = await Event.find().sort({ date: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

app.post('/api/admin/events', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'sankalp_events');
    } else {
      imageUrl = req.body.image || '';
    }

    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      image: imageUrl
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

app.put('/api/admin/events/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.buffer, 'sankalp_events');
    }
    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

app.delete('/api/admin/events/:id', isAuthenticated, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// Gallery CRUD Operations
app.get('/api/admin/gallery', isAuthenticated, async (req, res) => {
  try {
    const list = await Gallery.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery.' });
  }
});

app.post('/api/admin/gallery', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file.' });
    }
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'sankalp_gallery');
    const item = new Gallery({
      imageUrl,
      caption: req.body.caption || ''
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to gallery.' });
  }
});

app.delete('/api/admin/gallery/:id', isAuthenticated, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gallery item deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery item.' });
  }
});

// Program CRUD Operations
app.get('/api/admin/programs', isAuthenticated, async (req, res) => {
  try {
    const list = await Program.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch programs.' });
  }
});

app.post('/api/admin/programs', isAuthenticated, async (req, res) => {
  try {
    let featuresArr = [];
    if (req.body.features) {
      featuresArr = Array.isArray(req.body.features) 
        ? req.body.features 
        : req.body.features.split('\n').filter(f => f.trim() !== '');
    }

    const prog = new Program({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      features: featuresArr,
      image: req.body.image || ''
    });

    await prog.save();
    res.status(201).json(prog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save program.' });
  }
});

app.put('/api/admin/programs/:id', isAuthenticated, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.features) {
      updateData.features = Array.isArray(updateData.features) 
        ? updateData.features 
        : updateData.features.split('\n').filter(f => f.trim() !== '');
    }
    const prog = await Program.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(prog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update program.' });
  }
});

app.delete('/api/admin/programs/:id', isAuthenticated, async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Program deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete program.' });
  }
});

// Route for serving index.html on root path or any unregistered paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(500).json({ error: 'Internal Server Error. Please contact administrator.' });
});

app.listen(PORT, () => {
  console.log(`Sankalp Digital Pathshala server running on port ${PORT}`);
});
