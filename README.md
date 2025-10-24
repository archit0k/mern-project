# MERN Project: CodeKeep Snippet Manager

This is a full-stack MERN application for my course project. It's a "Code Snippet Manager" that allows a user to create, save, categorize, and search for their personal code snippets.

## Live Deployment Links

* **Frontend (Vercel):** [https://mern-project-4re1p0k2s-archit24bcs10194-scalercoms-projects.vercel.app/](https://mern-project-4re1p0k2s-archit24bcs10194-scalercoms-projects.vercel.app/)
* **Backend (Render):** [https://codekeep-api-o181.onrender.com](https://codekeep-api-o181.onrender.com)

## Features
* **Full CRUD:** Create, Read, Update, and Delete code snippets.
* **Live Search:** Instantly search snippets by title, category, or description.
* **Category Filtering:** Quickly filter the snippet list by category.
* **Syntax Highlighting:** Displays code beautifully using Prism.js (loaded from CDN).
* **Copy to Clipboard:** One-click button to copy code.
* **Responsive Design:** A clean, modern UI that works on all screen sizes.

## Technology Stack
* **Frontend:** React (Vite)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (with Mongoose)
* **Deployment:** Frontend on Vercel, Backend on Render.
* **Libraries:** Axios, Prism.js

## Local Setup Instructions

1.  **Clone the repository:**
    `git clone https://github.com/archit0k/mern-project`

2.  **Backend Setup:**
    ```bash
    cd server
    npm install
    # Create a .env file and add your MONGO_URI
    npm run dev
    ```

3.  **Frontend Setup (in a new terminal):**
    ```bash
    cd client
    npm install
    npm run dev
    ```