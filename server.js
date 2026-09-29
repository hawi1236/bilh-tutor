const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup static file serving
const uploadsDir = path.join(__dirname, 'uploads', 'school_ids');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Multer storage for School ID uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'school_id_' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Embedded JSON Database
const dbFilePath = path.join(__dirname, 'db.json');

function initDB() {
  if (!fs.existsSync(dbFilePath)) {
    const initialData = {
      jobs: [
        {
          id: "JOB-101",
          parentName: "አቶ ካሳሁን ታደሰ",
          phone: "0911223344",
          grade: "9-12",
          subjects: "ሒሳብ እና ፊዚክስ (12ኛ ክፍል)",
          learningMode: "ቤት ለቤት",
          location: "ድሬዳዋ - ቀበሌ 02",
          salary: "3500 ብር/ወር",
          schedule: "በሳምንት 3 ቀን (ከቀኑ 10:00 - 12:00)",
          details: "ለ12ኛ ክፍል ብሔራዊ ፈተና ውጤታማ ድጋፍ የሚሰጥ አስጠኚ ይፈለጋል::",
          status: "published",
          createdAt: new Date().toISOString()
        },
        {
          id: "JOB-102",
          parentName: "ወ/ሮ አልማዝ በቀለ",
          phone: "0922334455",
          grade: "5-8",
          subjects: "እንግሊዝኛ እና ሳይንስ (8ኛ ክፍል)",
          learningMode: "በአንላይን",
          location: "ድሬዳዋ / Online",
          salary: "2800 ብር/ወር",
          schedule: "በሳምንት 4 ቀን",
          details: "ለ8ኛ ክፍል ሚኒስትሪ ፈተና ዝግጅት ድጋፍ::",
          status: "published",
          createdAt: new Date().toISOString()
        },
        {
          id: "JOB-103",
          parentName: "ዶ/ር አበራ ወርቁ",
          phone: "0933445566",
          grade: "KG-4",
          subjects: "ሁሉም የትምህርት ዓይነቶች (Primary)",
          learningMode: "ቤት ለቤት",
          location: "ድሬዳዋ - ቀበሌ 06",
          salary: "3000 ብር/ወር",
          schedule: "በሳምንት 3 ቀን",
          details: "ለ3ኛ ክፍል ተማሪ የቤት ስራና መሠረታዊ ንባብ ድጋፍ::",
          status: "pending_approval",
          createdAt: new Date().toISOString()
        }
      ],
      applications: [
        {
          id: "APP-501",
          jobId: "JOB-101",
          jobTitle: "ሒሳብ እና ፊዚክስ (12ኛ ክፍል)",
          tutorName: "ዮናስ ጌታቸው",
          phone: "0955667788",
          fieldOfStudy: "B.Sc in Electrical Engineering (Dire Dawa Univ)",
          experience: "4 ዓመት በቤት ለቤት አስጠኚነት",
          schoolIdCardUrl: "/assets/images/logo.jpg",
          status: "pending_verification",
          appliedAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
  }
}

function readDB() {
  initDB();
  const raw = fs.readFileSync(dbFilePath, 'utf8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

// REST API Endpoints

// 1. Get all published jobs for Tutors to view & apply
app.get('/api/jobs', (req, res) => {
  const db = readDB();
  const publishedJobs = db.jobs.filter(j => j.status === 'published');
  res.json(publishedJobs);
});

// 2. Parent / Family submits a new Tutoring Job Request
app.post('/api/jobs', (req, res) => {
  const { parentName, phone, grade, subjects, learningMode, location, salary, schedule, details } = req.body;
  if (!parentName || !phone || !grade || !subjects) {
    return res.status(400).json({ error: "እባክዎን ሁሉንም አስፈላጊ መረጃዎች ያስገቡ" });
  }

  const db = readDB();
  const newJob = {
    id: 'JOB-' + Math.floor(100 + Math.random() * 900),
    parentName,
    phone,
    grade,
    subjects,
    learningMode: learningMode || 'ቤት ለቤት',
    location: location || 'ድሬዳዋ',
    salary: salary || 'በስምምነት',
    schedule: schedule || 'ተለዋዋጭ',
    details: details || '',
    status: 'pending_approval',
    createdAt: new Date().toISOString()
  };

  db.jobs.unshift(newJob);
  writeDB(db);

  res.status(201).json({ message: "የአስጠኚ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! የአድሚን ማረጋገጫ ይጠብቃል::", job: newJob });
});

// 3. Tutor applies for an open job & uploads School ID
app.post('/api/jobs/:id/apply', upload.single('schoolIdCard'), (req, res) => {
  const jobId = req.params.id;
  const { tutorName, phone, fieldOfStudy, grade, experience } = req.body;

  if (!tutorName || !phone || !fieldOfStudy || !grade || !req.file) {
    return res.status(400).json({ error: "እባክዎን ስም፣ ስልክ፣ የትምህርት ዘርፍ፣ ክፍል/ዓመት እና School ID ያስገቡ" });
  }

  const db = readDB();
  const targetJob = db.jobs.find(j => j.id === jobId);
  if (!targetJob) {
    return res.status(404).json({ error: "ስራው አልተገኘም" });
  }
  if (targetJob.status !== 'published') {
    return res.status(400).json({ error: "ይህ ስራ ክፍት አይደለም" });
  }

  const schoolIdCardUrl = `/uploads/school_ids/${req.file.filename}`;

  const newApplication = {
    id: 'APP-' + Math.floor(500 + Math.random() * 900),
    jobId: targetJob.id,
    jobTitle: targetJob.subjects + ' (' + targetJob.grade + ')',
    tutorName,
    phone,
    fieldOfStudy,
    grade,
    experience: experience || 'አዲስ አስጠኚ',
    schoolIdCardUrl,
    status: 'pending_verification',
    appliedAt: new Date().toISOString()
  };

  db.applications.unshift(newApplication);
  writeDB(db);

  res.status(201).json({ 
    message: "የስራ ማመልከቻዎ እና የትምህርት ቤት መታወቂያዎ (School ID) ተልኳል! የአድሚን ማረጋገጫ ይጠብቃል::", 
    application: newApplication 
  });
});

// 4. Admin API: Get Statistics
app.get('/api/admin/stats', (req, res) => {
  const db = readDB();
  const totalJobs = db.jobs.length;
  const pendingRequests = db.jobs.filter(j => j.status === 'pending_approval').length;
  const publishedJobs = db.jobs.filter(j => j.status === 'published').length;
  const assignedJobs = db.jobs.filter(j => j.status === 'assigned').length;
  const totalApps = db.applications.length;
  const pendingApps = db.applications.filter(a => a.status === 'pending_verification').length;

  res.json({
    totalJobs,
    pendingRequests,
    publishedJobs,
    assignedJobs,
    totalApps,
    pendingApps
  });
});

// 5. Admin API: Get all jobs (including pending parent requests)
app.get('/api/admin/jobs', (req, res) => {
  const db = readDB();
  res.json(db.jobs);
});

// 6. Admin API: Update Job Status (Publish / Reject / Assign)
app.put('/api/admin/jobs/:id/status', (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body; // 'published', 'rejected', 'assigned', 'closed'

  const db = readDB();
  const job = db.jobs.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: "ስራው አልተገኘም" });
  }

  job.status = status;
  writeDB(db);

  res.json({ message: `የስራው ሁኔታ ወደ '${status}' ተቀይሯል::`, job });
});

// 7. Admin API: Get all Tutor Applications & uploaded School IDs
app.get('/api/admin/applications', (req, res) => {
  const db = readDB();
  res.json(db.applications);
});

// 8. Admin API: Verify & Accept/Reject Tutor Application
app.put('/api/admin/applications/:id/verify', (req, res) => {
  const appId = req.params.id;
  const { status } = req.body; // 'verified', 'rejected', 'accepted'

  const db = readDB();
  const appItem = db.applications.find(a => a.id === appId);
  if (!appItem) {
    return res.status(404).json({ error: "ማመልከቻው አልተገኘም" });
  }

  appItem.status = status;

  // If accepted, set associated job to 'assigned'
  if (status === 'accepted') {
    const job = db.jobs.find(j => j.id === appItem.jobId);
    if (job) {
      job.status = 'assigned';
    }
  }

  writeDB(db);

  res.json({ message: `የአስጠኚው መታወቂያ ማረጋገጫ ወደ '${status}' ተቀይሯል::`, application: appItem });
});

// Initialize DB and start server
initDB();
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ብልህ ቱቶር (Bilh Tutors) Backend Server Running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
