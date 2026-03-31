# Setup Guide

## Prerequisites

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Operating System**: Windows, macOS, or Linux

---

## Installation

### 1. Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd transformer

# Or extract the ZIP file and navigate to the directory
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages:
- express
- cors
- bcrypt
- dotenv
- helmet
- compression
- express-rate-limit
- morgan
- socket.io

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL=24
```

### 4. Initialize Data Files

The application will automatically create necessary data files on first run:
- `data/users.json`
- `data/transformers.json`
- `data/checklists.json`
- `data/auditLogs.json`
- `data/boms.json`

---

## Running the Application

### Development Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

### Production Mode
```bash
NODE_ENV=production npm start
```

---

## Default Login Credentials

**Username**: `admin`  
**Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password after first login!

---

## Project Structure

```
transformer/
├── config/              # Configuration files
├── controllers/         # Business logic
├── data/                # JSON database files
├── docs/                # Documentation
├── middlewares/         # Express middlewares
├── models/              # Data models
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   │   ├── core/       # Core functionality
│   │   ├── features/   # Business features
│   │   ├── ui/         # UI components
│   │   └── calculation-engine/
│   └── index.html      # Main HTML file
├── routes/              # API routes
├── tests/               # Test files
├── utils/               # Utility functions
├── .env                 # Environment variables
├── package.json         # Dependencies
└── server.js            # Entry point
```

---

## Testing

### Access the Application
1. Open browser
2. Navigate to `http://localhost:3000`
3. Login with default credentials
4. Test features:
   - Dashboard
   - Transformer Master
   - Manufacturing Checklist
   - Design Calculations
   - Audit Log

### Verify Installation
- Check console for errors
- Test login/logout
- Create a test transformer
- Perform a test calculation

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process-id> /F

# Linux/Mac
lsof -i :3000
kill -9 <process-id>
```

### Missing Dependencies
```bash
npm install
```

### Data File Errors
Delete `data/` folder and restart the server to regenerate files.

### Permission Errors
Run terminal as administrator (Windows) or use `sudo` (Linux/Mac).

---

## Next Steps

1. Change default password
2. Configure email settings (optional)
3. Set up automated backups
4. Review API documentation (`docs/API.md`)
5. Review architecture (`docs/ARCHITECTURE.md`)

---

## Support

For issues or questions:
1. Check documentation in `docs/`
2. Review error logs in `logs/`
3. Contact system administrator
