# Transformer App

A web-based application for managing transformer-related data, inspections, and checklists.  
This project helps organize transformer records, user data, and checklist workflows in a simple and structured way.

---

## 📌 Features

- Manage transformer data
- Maintain inspection checklists
- Store and retrieve documents in JSON format
- User management system
- Simple web interface
- Backend powered by Node.js

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript
- **Data Storage:** JSON files
- **Version Control:** Git & GitHub

---

## 📂 Project Structure

transformer-app/
│
├── public/ # Frontend files (HTML, CSS, JS)
├── uploads/ # Uploaded files (ignored by git)
├── data/ # Data-related folders/files
│
├── server.js # Main server file
├── package.json # Project metadata & dependencies
├── package-lock.json # Dependency lock file
├── users.json # User data
├── transformers.json # Transformer data
├── checklists.json # Checklist data
├── documents.json # Document data
└── .gitignore # Ignored files & folders

```md
## ▶️ How to Run the Project Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/rahulbhagat31-dotcom/transformer-app.git
2. Go into the project folder
cd transformer-app

3.bInstall dependencies
npm install

4. Start the server
node server.js

5. Open in browser
http://localhost:3000
