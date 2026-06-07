import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Paths for JSON storage
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PARENTS_FILE = path.join(DATA_DIR, "parents.json");
const TEACHERS_FILE = path.join(DATA_DIR, "teachers.json");
const SCHOOLS_FILE = path.join(DATA_DIR, "schools.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

// Helpers to load/save JSON stores
const readJSON = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return defaultValue;
};

const writeJSON = <T>(filePath: string, data: T): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
};

// Seed initial data if files do not exist
const seedInitialData = () => {
  const defaultParents = [
    {
      id: "p1",
      name: "Rajesh Kumar",
      mobile: "6205355760",
      email: "rajesh.muzaffarpur@gmail.com",
      city: "Muzaffarpur",
      studentClass: "Class 10",
      board: "CBSE",
      subjects: "Mathematics & Science",
      mode: "Home",
      address: "Mithanpura, Near Club Road, Muzaffarpur",
      message: "Looking for an experienced CBSE tutor for science and maths.",
      createdAt: new Date().toISOString()
    },
    {
      id: "p2",
      name: "Suman Sharma",
      mobile: "7255941761",
      email: "suman.sharma@hotmail.com",
      city: "Patna",
      studentClass: "Class 12",
      board: "State Board",
      subjects: "Physics & Chemistry",
      mode: "Home",
      address: "Kankarbagh, Patna, Bihar",
      message: "Urgent requirements. Needs female home tutor if possible.",
      createdAt: new Date().toISOString()
    }
  ];

  const defaultTeachers = [
    {
      id: "t1",
      name: "Prakash Jha",
      mobile: "9876543210",
      email: "prakash.jha.edu@gmail.com",
      gender: "Male",
      city: "Muzaffarpur",
      qualification: "M.Sc. in Physics",
      experience: "5 Years",
      subjects: "Physics, Mathematics",
      classes: "Class 9 to 12",
      mode: "Both",
      expectedFees: "5000/month",
      resumeUrl: "Simulated Resume File",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      address: "Kanti, Muzaffarpur, Bihar",
      isApproved: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "t2",
      name: "Anjali Mehta",
      mobile: "8765432109",
      email: "anjali.tutor@yahoo.com",
      gender: "Female",
      city: "Patna",
      qualification: "B.Tech in Computer Science",
      experience: "3 Years",
      subjects: "Computer, Mathematics",
      classes: "Class 1 to 10",
      mode: "Online",
      expectedFees: "4000/month",
      resumeUrl: "Simulated Resume File",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      address: "Boring Road, Patna",
      isApproved: false,
      createdAt: new Date().toISOString()
    }
  ];

  const defaultSchools = [
    {
      id: "s1",
      orgName: "Gyan Niketan Academy",
      contactPerson: "Mr. Ramesh Prasad",
      phone: "9563412078",
      email: "contact@gyanniketan.edu.in",
      location: "Muzaffarpur, Bihar",
      details: "Need 2 CBSE PGT Teachers for Physics and Computer Science on urgent basis.",
      createdAt: new Date().toISOString()
    }
  ];

  const defaultLogs = [
    {
      id: "l1",
      user: "System",
      action: "Database Initialized",
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1"
    }
  ];

  if (!fs.existsSync(PARENTS_FILE)) writeJSON(PARENTS_FILE, defaultParents);
  if (!fs.existsSync(TEACHERS_FILE)) writeJSON(TEACHERS_FILE, defaultTeachers);
  if (!fs.existsSync(SCHOOLS_FILE)) writeJSON(SCHOOLS_FILE, defaultSchools);
  if (!fs.existsSync(LOGS_FILE)) writeJSON(LOGS_FILE, defaultLogs);
};

seedInitialData();

// Simulated Mailer / Notification logger
const simulateEmail = (to: string, subject: string, body: string) => {
  console.log(`[SIMULATED EMAIL SENT TO: ${to}]`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY SUMMARY: ${body.substring(0, 100)}...`);
};

// --- API ENDPOINTS ---

// Get consolidated collections for Admin & Analytics
app.get("/api/data", (req, res) => {
  try {
    const parents = readJSON(PARENTS_FILE, []);
    const teachers = readJSON(TEACHERS_FILE, []);
    const schools = readJSON(SCHOOLS_FILE, []);
    const logs = readJSON(LOGS_FILE, []);
    res.json({ parents, teachers, schools, logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to read database records" });
  }
});

// Submit Parent Inquiry
app.post("/api/parent-registration", (req, res) => {
  try {
    const data = req.body;
    const parents = readJSON<any[]>(PARENTS_FILE, []);
    const newRecord = {
      id: "parent_" + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString()
    };
    parents.push(newRecord);
    writeJSON(PARENTS_FILE, parents);

    // Dynamic Admin log
    const logs = readJSON<any[]>(LOGS_FILE, []);
    logs.push({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      user: "Parent / Student Visitor",
      action: `New Tutor Request submitted by ${data.name} for Class ${data.studentClass}`,
      timestamp: new Date().toISOString(),
      ip: req.ip || "unknown"
    });
    writeJSON(LOGS_FILE, logs);

    // Send confirmations
    simulateEmail(
      data.email, 
      "Raft Tutor Axis - Your Request Recieved", 
      `Hello ${data.name},\nWe have successfully received your request for a home tutor for class ${data.studentClass}. Our team will match a suitable teacher and contact you within 24 hours to schedule your 2 DAYS FREE DEMO.\n\nContact us at 6205355760 or 7255941761 for speedy processing.`
    );

    res.json({ success: true, record: newRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to log parent inquiry" });
  }
});

// Submit Teacher Registration
app.post("/api/teacher-registration", (req, res) => {
  try {
    const data = req.body;
    const teachers = readJSON<any[]>(TEACHERS_FILE, []);
    const newRecord = {
      id: "teacher_" + Math.random().toString(36).substr(2, 9),
      ...data,
      isApproved: false,
      createdAt: new Date().toISOString()
    };
    teachers.push(newRecord);
    writeJSON(TEACHERS_FILE, teachers);

    // Log action
    const logs = readJSON<any[]>(LOGS_FILE, []);
    logs.push({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      user: "Teacher Applicant",
      action: `New Teacher Registration received from ${data.name} (${data.qualification})`,
      timestamp: new Date().toISOString(),
      ip: req.ip || "unknown"
    });
    writeJSON(LOGS_FILE, logs);

    // Confirmation Email
    simulateEmail(
      data.email,
      "Raft Tutor Axis - Registration Received",
      `Dear ${data.name},\nThank you for registering on India's Growing Teacher Network with Raft Tutor Axis. Our operations head will review your educational qualifications and contact you for professional onboarding.\n\nBest wishes,\nRaft Tutor Axis Operations.`
    );

    res.json({ success: true, record: newRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to persist teacher registration" });
  }
});

// Submit School Solutions Request
app.post("/api/school-request", (req, res) => {
  try {
    const data = req.body;
    const schools = readJSON<any[]>(SCHOOLS_FILE, []);
    const newRecord = {
      id: "school_" + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString()
    };
    schools.push(newRecord);
    writeJSON(SCHOOLS_FILE, schools);

    // Log action
    const logs = readJSON<any[]>(LOGS_FILE, []);
    logs.push({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      user: "School / Institution",
      action: `New school solution inquiry submitted by ${data.orgName} (${data.contactPerson})`,
      timestamp: new Date().toISOString(),
      ip: req.ip || "unknown"
    });
    writeJSON(LOGS_FILE, logs);

    // Email
    simulateEmail(
      data.email,
      "Raft Tutor Axis - Institution Solution Request",
      `Dear ${data.contactPerson},\nWe have compiled your institution requirements for ${data.orgName}. Our institutional coordinator is looking through our verified database of qualified educators to provide immediate candidates for demonstration.\n\nWarm regards,\nRaft Tutor Axis.`
    );

    res.json({ success: true, record: newRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit school solution request" });
  }
});

// Admin Authentication Route
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    (username === "admin" && password === "admin123") || 
    (username === "rafttutor" && password === "axis2026")
  ) {
    // Log Admin entry
    const logs = readJSON<any[]>(LOGS_FILE, []);
    logs.push({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      user: username,
      action: "Admin Dashboard Logged In Successfully",
      timestamp: new Date().toISOString(),
      ip: req.ip || "unknown"
    });
    writeJSON(LOGS_FILE, logs);

    res.json({ success: true, user: username, token: "session_token_approved_" + Math.random().toString(36).substr(2, 9) });
  } else {
    res.status(401).json({ error: "Invalid admin credentials" });
  }
});

// Admin Edit / Delete Actions
app.post("/api/admin/action", (req, res) => {
  try {
    const { actionType, entityType, id, payload, adminUser } = req.body;
    const logs = readJSON<any[]>(LOGS_FILE, []);

    if (actionType === "delete") {
      let fileToUse = "";
      if (entityType === "parents") fileToUse = PARENTS_FILE;
      else if (entityType === "teachers") fileToUse = TEACHERS_FILE;
      else if (entityType === "schools") fileToUse = SCHOOLS_FILE;

      if (fileToUse) {
        let records = readJSON<any[]>(fileToUse, []);
        const originalLength = records.length;
        records = records.filter(r => r.id !== id);
        writeJSON(fileToUse, records);

        logs.push({
          id: "log_" + Math.random().toString(36).substr(2, 9),
          user: adminUser || "Admin",
          action: `Deleted ${entityType.slice(0, -1)} with ID ${id}`,
          timestamp: new Date().toISOString(),
          ip: req.ip || "unknown"
        });
        writeJSON(LOGS_FILE, logs);
        return res.json({ success: true });
      }
    }

    if (actionType === "approve_teacher") {
      const teachers = readJSON<any[]>(TEACHERS_FILE, []);
      const index = teachers.findIndex(t => t.id === id);
      if (index !== -1) {
        teachers[index].isApproved = !teachers[index].isApproved;
        writeJSON(TEACHERS_FILE, teachers);

        logs.push({
          id: "log_" + Math.random().toString(36).substr(2, 9),
          user: adminUser || "Admin",
          action: `${teachers[index].isApproved ? 'Approved' : 'Disapproved'} Teacher: ${teachers[index].name}`,
          timestamp: new Date().toISOString(),
          ip: req.ip || "unknown"
        });
        writeJSON(LOGS_FILE, logs);
        return res.json({ success: true, isApproved: teachers[index].isApproved });
      }
    }

    res.status(400).json({ error: "Invalid admin action request" });
  } catch (error) {
    res.status(500).json({ error: "Admin operation failed" });
  }
});

// Live Gemini QA Support chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const defaultResponseStr = `Hello! Thank you for contacting Raft Tutor Axis Customer Support.
We are India's growing tutor-providing network, specalizing in Muzaffarpur, Bihar, and other states.
Here are our quick contacts for instant bookings:
- Phone: 6205355760 / 7255941761
- Email: info@rafttutoraxis.com
- Services offered: Home Tuitions, Online Classes, School/Institute recruitment.
How can I assist you with finding the perfect tutor today?`;

    // Check if real Gemini Key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Simulate intelligent bot responses if API key is not configured yet
      const msgLower = message.toLowerCase();
      let reply = "";
      if (msgLower.includes("demo") || msgLower.includes("free") || msgLower.includes("trial")) {
        reply = "Yes! Raft Tutor Axis provides a **2 DAYS FREE DEMO** classes with our verified and experienced home tutors so you can select the perfect match for your child. Would you like to book a demo now?";
      } else if (msgLower.includes("phone") || msgLower.includes("number") || msgLower.includes("contact") || msgLower.includes("call")) {
        reply = "You can directly call us at **6205355760** or **7255941761** for immediate responses. Our physical center is located in **Muzaffarpur, Bihar**!";
      } else if (msgLower.includes("subject") || msgLower.includes("class") || msgLower.includes("board")) {
        reply = "We provide home tuition services for all subjects, classes (Class 1 to 12, PGT/TGT), and educational boards such as **CBSE, ICSE, and State Boards**. Our teachers are fully vetted with strong credentials.";
      } else if (msgLower.includes("fees") || msgLower.includes("price") || msgLower.includes("cost")) {
        reply = "Our home tuition fees are very affordable and vary based on the student's class, board, and subjects. Typically, home tuition starts from INR 2,500/month. We can design a personalized learning budget for you!";
      } else if (msgLower.includes("teacher") || msgLower.includes("join") || msgLower.includes("become")) {
        reply = "Educators can register easily using our online 'Join as Teacher' form. Be sure to include your qualifications, experience, and subjects. We review registrations daily!";
      } else {
        reply = defaultResponseStr;
      }
      return res.json({ text: reply });
    }

    // Call actual Gemini API if key is there
    const systemInstruction = `You are the primary 24/7 client assistant for Raft Tutor Axis (RTA), an elite home tuition and teacher recruitment platform operating across India (especially Muzaffarpur, Bihar).
Our contact numbers are 6205355760 and 7255941761. Email is info@rafttutoraxis.com.
Key aspects: we offer 2 DAYS FREE DEMO classes, list over 40,000+ teachers, completed 20,000+ tuitions, and service CBSE/ICSE/State boards.
Assist the user with professional, helpful, polite answers in both English and Hindi depending on how they converse. Keep replies succinct and clear. Always share our contact numbers if they have strong interest.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: { systemInstruction }
    });

    // Seed chat history if provided
    if (chatHistory && Array.isArray(chatHistory)) {
      // Just send the message inside the session
    }

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text || defaultResponseStr });
  } catch (error) {
    console.error("Gemini Chat support error:", error);
    res.json({ text: "Thank you for reaching out. Our support numbers are 6205355760 and 7255941761. Please call us directly for immediate tuition arrangement." });
  }
});

// AI Generated Analysis Reports for Admins using Gemini
app.post("/api/admin/gemini-report", async (req, res) => {
  try {
    const parents = readJSON<any[]>(PARENTS_FILE, []);
    const teachers = readJSON<any[]>(TEACHERS_FILE, []);
    const schools = readJSON<any[]>(SCHOOLS_FILE, []);

    const dataSummary = {
      parentCount: parents.length,
      teacherCount: teachers.length,
      schoolInquiryCount: schools.length,
      parentsSample: parents.map(p => ({ city: p.city, class: p.studentClass, board: p.board, subjects: p.subjects })),
      teachersSample: teachers.map(t => ({ city: t.city, qualification: t.qualification, experience: t.experience, subjects: t.subjects, isApproved: t.isApproved })),
      schoolsSample: schools.map(s => ({ location: s.location, details: s.details }))
    };

    const prompt = `Analyze this live registration data for Raft Tutor Axis and compile a strategic administrative report in markdown:
${JSON.stringify(dataSummary, null, 2)}

In your report, cover:
1. Student Demands Analysis (Main educational boards, class requirements, leading subjects).
2. Teacher Credentials & Vetted Readiness (Qualifications and matching potential).
3. Potential System Anomalies or Spams (Observe if there are weird classes or missing contact items).
4. Automated Suggestions for Marketing and operations growth in North India & Muzaffarpur.

Keep the tone concise, executive, and direct.`;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Safe simulated analysis report if API key is not configured
      const simulatedMarkdown = `# RTA Executive Analytics Report (Simulated)

## 1. Student Demands Analysis
- **Core Market Focus**: Home Tuition requests are dominated by **Muzaffarpur** and **Patna** in Bihar.
- **Top Academic Requirements**: Higher secondary grades (**Class 10 and Class 12**) looking for Mathematics, Physics, and Science tutors.
- **Board Distribution**: Higher request volume for **CBSE** sheets followed by local State Boards.

## 2. Tutor Vetting & Talent Pool
- **Teacher Density**: 40,000+ national network presence with localized recruiters in Bihar.
- **Specializations**: Strongly qualified pool holding M.Sc. in Physics, Science disciplines, and computer engineering certificates.
- **Approval Status**: Standard vetting active. Verification pipeline is up-to-date.

## 3. Alerts & Data Anomalies
- No severe system alerts. Registered phone sequences follow Indian 10-digit formats safely.
- **Preemptive Recommendation**: Match tutors who live within 5km radius to reduce travel costs.

## 4. Strategic Operations Counsel
- **Free Trial Conversions**: Leverage the '2 Days Free Demo' feature on social media banners to generate massive registration cycles.
- **Institute Linkups**: Partner with emerging coaching schools in secondary cities to scale school teacher recruitment programs.`;
      return res.json({ report: simulatedMarkdown });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an Elite Business Analyst and Education Consultant assisting the founders of Raft Tutor Axis.",
      }
    });

    res.json({ report: response.text || "Report generation succeeded but returned empty." });
  } catch (error) {
    console.error("Gemini Report Generation error:", error);
    res.status(500).json({ error: "Failed to generate report using Gemini API" });
  }
});

// --- CLIENT MIDDLEWARE FOR VITE ---
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Raft Tutor Axis Server] running on http://localhost:${PORT}`);
  });
}

start();
