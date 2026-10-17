# EduSmart – Quality Education 🎓

EduSmart is an educational web platform developed as a college project based on **United Nations Sustainable Development Goal 4 (SDG 4): Quality Education**.

The project empowers learners by providing accessible foundational courses in computer science and technology, interactive knowledge testing, and automated progress tracking.

---

## 🌟 Key Features

1. **UN SDG 4 Focus**: Educational awareness highlighting equal access to education, inclusive classrooms, and lifelong learning opportunities.
2. **Foundational Courses**:
   - **HTML & CSS**: Web structure, styling, modern Flexbox & Grid layouts.
   - **JavaScript Basics**: Client-side logic, DOM manipulation, and dynamic events.
   - **Python Programming**: Python syntax, data structures, and algorithmic fundamentals.
   - **Introduction to Artificial Intelligence**: Core concepts of AI, pattern recognition, and ethical AI in education.
3. **Interactive Knowledge Check Quiz**:
   - Topic-based practice with dynamic course switching.
   - Immediate feedback and explanations.
   - Certified server-side score calculation and attempts recording.
4. **Student Practice Progress Dashboard**:
   - Persistent tracking of attempts, scores, and completion timestamps stored in SQLite.
5. **Interactive Contact Form**: Client-side validation with instant feedback.
6. **Responsive Design**: Clean UI adhering to SDG 4 theme colors (Blue `#2563eb`, Light Green `#10b981`, and White `#ffffff`).

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+).
- **Backend**: Python Flask 3.x.
- **Database**: SQLite3 (embedded, zero-configuration).

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+ installed on your computer.

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sainani17868/Edusmart_project.git
   cd Edusmart_project
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Flask server**:
   ```bash
   python app.py
   ```
   *Note: The SQLite database (`edusmart.db`) automatically initializes and seeds sample courses and questions on first run.*

4. **Access the application**:
   Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🧪 Testing

To run the backend test suite verifying all API endpoints, database operations, and score calculations:
```bash
python test_backend.py
```

---

## 📄 License & Attribution

Developed for academic demonstration supporting **UN Sustainable Development Goal 4 (SDG 4: Quality Education)**.
