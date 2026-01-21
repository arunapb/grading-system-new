# 🎓 University of Moratuwa Grading System

A comprehensive web-based student grading management system with automated PDF result parsing, GPA calculation, and rich analytics dashboard. Built for managing multi-batch, multi-degree academic records with precision and efficiency.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### 📊 **Comprehensive Analytics Dashboard**
- Real-time statistics (total batches, students, average CGPA, PDF count)
- Interactive batch performance comparison charts
- Grade distribution visualization with pie charts
- Top performing students leaderboard with rankings

### 👨‍🎓 **Student Management**
- Advanced search and filtering capabilities
- Individual student profiles with detailed academic history
- Semester-by-semester performance tracking
- Grade analytics with CGPA trend visualization
- Automatic degree class prediction (First Class, Second Upper, etc.)
- PDF report generation for student records

### 🔐 **Role-Based Access Control**
- **Admin Access**: Full system control, PDF upload, batch management
- **Lecturer Access**: Read-only access to student data and analytics
- Secure authentication with NextAuth.js

### 📁 **Multi-Batch Architecture**
- Hierarchical organization: Batch → Degree → Year → Semester
- Support for multiple degree programs (CSE, ENTC, Mechanical, etc.)
- Flexible batch structure management

### 📄 **Automated PDF Parsing**
- Intelligent PDF result sheet parsing
- Automatic grade extraction and validation
- Batch processing for multiple PDFs
- Support for all grade formats (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, E)
- Module metadata extraction (code, name, credits)

### 🎯 **Precise GPA Calculations**
- 4-decimal precision CGPA calculations
- Semester GPA (SGPA) tracking
- Credit-weighted grade point calculations
- Real-time GPA updates

### 📈 **Rich Data Visualization**
- Interactive Recharts-powered analytics
- Grade distribution charts
- Performance trend analysis
- Module-wise performance tracking

### 🎨 **Modern UI/UX**
- Responsive design (desktop, tablet, mobile)
- Dark mode support
- Beautiful shadcn/ui components
- Smooth animations and transitions
- Intuitive navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/grading-system.git
cd grading-system

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Default Credentials

**Admin:**
- Username: `admin`
- Password: `123456`

**Lecturers:**
- Username: `lecturer1` / `lecturer2` / `lecturer3`
- Password: See `.env` file (LECTURE_CODE1, LECTURE_CODE2, LECTURE_CODE3)

> ⚠️ **Important**: Change default passwords in production!

## 📁 Project Structure

```
grading-system/
├── app/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── students/             # Student data endpoints
│   │   ├── admin/                # Admin endpoints
│   │   └── batches/              # Batch management
│   ├── admin/                    # Admin pages
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── batches/              # Batch management UI
│   │   └── upload/               # PDF upload interface
│   ├── students/                 # Student pages
│   │   ├── page.tsx              # Student list
│   │   └── [id]/                 # Individual student profile
│   ├── login/                    # Authentication
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main dashboard
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── MainNav.tsx               # Navigation bar
│   ├── StudentHeader.tsx         # Student profile header
│   ├── SemesterCard.tsx          # Semester performance card
│   └── GradeAnalytics.tsx        # Analytics charts
├── lib/
│   ├── parser.ts                 # PDF parsing logic
│   ├── gpa-calculator.ts         # GPA calculation utilities
│   ├── student-aggregator.ts    # Student data aggregation
│   ├── db-utils.ts               # Database utilities
│   └── utils.ts                  # General utilities
├── data/                         # Data storage
│   ├── [batch]/                  # Batch folders
│   │   └── [degree]/             # Degree folders
│   │       └── [year]/           # Year folders
│   │           └── [semester]/   # Semester folders
│   │               ├── *.pdf     # Result PDFs
│   │               └── *.json    # Parsed data
│   └── metadata.json             # System metadata
└── middleware.ts                 # Authentication middleware
```

## 🎯 Usage Guide

### For Administrators

#### 1. **Upload PDF Results**
- Navigate to **Admin → Upload PDFs**
- Select destination (Batch, Degree, Year, Semester)
- Drag and drop PDF files or browse to select
- System automatically parses and extracts grades

#### 2. **Manage Batches**
- Navigate to **Admin → View Structure**
- View hierarchical batch organization
- Add new batches as needed
- Monitor batch statistics

#### 3. **View Analytics**
- Access **Admin Dashboard** for system-wide statistics
- View batch performance comparisons
- Check grade distribution across all batches
- Monitor top performing students

### For Lecturers

#### 1. **Browse Students**
- Navigate to **Students** page
- Use search bar to find specific students
- Sort by CGPA, credits, or name
- Click "View" to see detailed profiles

#### 2. **View Student Profiles**
- See complete academic history
- Review semester-by-semester performance
- Analyze grade trends with charts
- Download PDF reports

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API
- **NextAuth.js** - Authentication
- **File-based Storage** - JSON data storage

### Utilities
- **pdf-parse** - PDF text extraction
- **jsPDF** - PDF generation
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

## 📊 Data Format

### PDF Parsing
The system extracts data from PDF result sheets using pattern matching:

**Expected Format:**
```
Index Number: XXXXXXX (6 digits + 1 letter)
Grade: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, E
```

**Example:**
```
204202G    A+
204203K    A
204204N    B+
```

### JSON Output
```json
{
  "indexNumber": "204202G",
  "modules": [
    {
      "code": "CS1101",
      "name": "Programming Fundamentals",
      "credits": 3,
      "grade": "A+",
      "semester": "1",
      "year": "1"
    }
  ],
  "cgpa": 3.8750
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Admin Credentials
ADMIN_PASSWORD=your_admin_password

# Lecturer Credentials
LECTURE_CODE1=lecturer1_password
LECTURE_CODE2=lecturer2_password
LECTURE_CODE3=lecturer3_password

# NextAuth Configuration
NEXTAUTH_SECRET=your_super_secret_key_change_this_in_production
NEXTAUTH_URL=http://localhost:3000
```

### Grade Point Scale

| Grade | Points | Description |
|-------|--------|-------------|
| A+ | 4.0 | Exceptional |
| A | 4.0 | Excellent |
| A- | 3.7 | Very Good |
| B+ | 3.3 | Good |
| B | 3.0 | Above Average |
| B- | 2.7 | Average |
| C+ | 2.3 | Below Average |
| C | 2.0 | Satisfactory |
| C- | 1.7 | Poor |
| D+ | 1.3 | Very Poor |
| D | 1.0 | Minimal Pass |
| E | 0.0 | Fail |

### Degree Classification

| CGPA Range | Class |
|------------|-------|
| 3.70 - 4.00 | First Class |
| 3.30 - 3.69 | Second Upper |
| 3.00 - 3.29 | Second Lower |
| 2.00 - 2.99 | Pass |
| < 2.00 | Fail |

## 🚢 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup
1. Set secure passwords in `.env`
2. Configure `NEXTAUTH_URL` to your domain
3. Generate a strong `NEXTAUTH_SECRET`
4. Set up SSL/TLS for HTTPS

### Recommended Hosting
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **DigitalOcean App Platform**

## 📝 API Documentation

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### Students
- `GET /api/students` - List all students
- `GET /api/students/[id]` - Get student details

### Admin
- `GET /api/admin/statistics` - System statistics
- `POST /api/admin/upload` - Upload PDF files
- `GET /api/admin/batches` - List batches

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- University of Moratuwa
- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- All contributors and users

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Check the [User Manual](docs/user_manual.md)

---

**Made with ❤️ for University of Moratuwa**
