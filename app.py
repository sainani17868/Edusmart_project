import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

# Determine base and frontend directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(BASE_DIR, 'EduSmart', 'index.html')):
    FRONTEND_DIR = os.path.join(BASE_DIR, 'EduSmart')
else:
    FRONTEND_DIR = BASE_DIR

DB_PATH = os.path.join(BASE_DIR, 'edusmart.db')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

# Simple CORS support for local API requests
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Courses Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            level TEXT NOT NULL,
            topics TEXT NOT NULL
        )
    ''')

    # 2. Questions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option INTEGER NOT NULL,
            explanation TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    ''')

    # 3. Practice Attempts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS practice_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL,
            percentage REAL NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    ''')

    # 4. Student Answers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS student_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            selected_option INTEGER NOT NULL,
            is_correct INTEGER NOT NULL,
            FOREIGN KEY (attempt_id) REFERENCES practice_attempts (id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
        )
    ''')

    # Insert sample courses & questions if database is empty
    cursor.execute('SELECT COUNT(*) FROM courses')
    count = cursor.fetchone()[0]

    if count == 0:
        sample_courses = [
            (
                'html-css',
                'HTML and CSS',
                'Master the fundamental building blocks of the web. Learn to structure web pages and style them beautifully.',
                'Beginner',
                json.dumps([
                    'Semantic HTML elements, links, and forms',
                    'CSS syntax, colors, typography, and box model',
                    'Modern Flexbox and CSS Grid layout techniques',
                    'Responsive mobile-first media queries'
                ])
            ),
            (
                'javascript',
                'JavaScript Basics',
                'Bring your websites to life with interactivity, variables, functions, DOM manipulation, and dynamic logic.',
                'Beginner to Intermediate',
                json.dumps([
                    'Variables, data types, and logical operators',
                    'Functions, conditional statements, and loops',
                    'DOM element selection and event listeners',
                    'Interactive forms, dynamic content, and animations'
                ])
            ),
            (
                'python',
                'Python Programming',
                'Learn clear and readable syntax for versatile programming, data handling, automation, and problem solving.',
                'Beginner Friendly',
                json.dumps([
                    'Clean syntax, variables, and data structures',
                    'Conditional branching, loops, and list handling',
                    'Writing reusable functions and modular code',
                    'File input/output and introductory algorithmic thinking'
                ])
            ),
            (
                'ai',
                'Introduction to Artificial Intelligence',
                'Understand basic concepts of Artificial Intelligence, how computers learn from patterns, and ethical AI for society.',
                'Foundational',
                json.dumps([
                    'Core concepts: Artificial Intelligence, Machine Learning, and Data',
                    'How pattern recognition works in computers',
                    'Ethical AI, fairness, privacy, and societal impact',
                    'AI applications in personalized education and tutoring'
                ])
            )
        ]

        cursor.executemany('''
            INSERT INTO courses (slug, title, description, level, topics)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_courses)

        # Retrieve course IDs
        cursor.execute('SELECT id, slug FROM courses')
        course_map = {row['slug']: row['id'] for row in cursor.fetchall()}

        sample_questions = [
            # HTML and CSS questions
            (
                course_map['html-css'],
                'Which HTML tag is used to create a hyperlink on a webpage?',
                '<link>', '<href>', '<a>', '<hyper>',
                2,
                'The <a> (anchor) tag with the href attribute creates clickable hyperlinks to other pages or resources.'
            ),
            (
                course_map['html-css'],
                'What does CSS stand for in web development?',
                'Cascading Style Sheets', 'Computer Standard Syntax', 'Creative System Styling', 'Centralized Sheet Structure',
                0,
                'CSS stands for Cascading Style Sheets, which dictates how HTML elements are presented on screen.'
            ),
            (
                course_map['html-css'],
                'Which CSS property is used to change the background color of an element?',
                'color', 'bgcolor', 'background-color', 'canvas-color',
                2,
                'The background-color property sets the background color of an element.'
            ),
            (
                course_map['html-css'],
                'Which HTML element represents the highest level and most important heading?',
                '<h6>', '<head>', '<heading>', '<h1>',
                3,
                '<h1> denotes the highest-level heading in HTML document semantics.'
            ),
            (
                course_map['html-css'],
                'In CSS, which layout model is specifically optimized for one-dimensional layouts (rows or columns)?',
                'Flexbox', 'Table Layout', 'Float', 'Inline-Block',
                0,
                'Flexbox (Flexible Box Layout) is designed specifically for one-dimensional alignment along a single axis.'
            ),

            # JavaScript Basics questions
            (
                course_map['javascript'],
                'Which keyword is used to declare a block-scoped variable in modern JavaScript?',
                'var', 'let', 'def', 'dim',
                1,
                'let declares a reassignable block-scoped local variable introduced in ES6.'
            ),
            (
                course_map['javascript'],
                'How do you write a single-line comment in JavaScript?',
                '<!-- Comment -->', '# Comment', '// Comment', '/* Comment */',
                2,
                'Two forward slashes (//) indicate a single-line comment in JavaScript.'
            ),
            (
                course_map['javascript'],
                'Which DOM method is used to select an element by its unique ID attribute?',
                'document.queryId()', 'document.getElementById()', 'document.findId()', 'document.selectElement()',
                1,
                'document.getElementById() returns a reference to the element matching the specified ID.'
            ),
            (
                course_map['javascript'],
                'What does the expression typeof "Hello" return in JavaScript?',
                'text', 'string', 'char', 'object',
                1,
                'typeof "Hello" evaluates to the primitive data type "string".'
            ),
            (
                course_map['javascript'],
                'Which event fires when an HTML button is clicked by a user?',
                'onhover', 'change', 'click', 'submit',
                2,
                'The click event fires when a user clicks the element with their mouse or keyboard.'
            ),

            # Python Programming questions
            (
                course_map['python'],
                'How do you print text to the console in Python?',
                'echo()', 'System.out.println()', 'console.log()', 'print()',
                3,
                'print() is the built-in function to display output in Python.'
            ),
            (
                course_map['python'],
                'What is the standard file extension for Python script files?',
                '.pt', '.py', '.pyt', '.python',
                1,
                'Python scripts traditionally use the .py file extension.'
            ),
            (
                course_map['python'],
                'Which built-in Python data structure is ordered, mutable, and written with square brackets []?',
                'Tuple', 'Dictionary', 'List', 'Set',
                2,
                'A Python List is an ordered, changeable collection of items defined with square brackets.'
            ),
            (
                course_map['python'],
                'Which keyword is used to define a custom function in Python?',
                'function', 'def', 'fun', 'define',
                1,
                'The def keyword starts a function definition in Python.'
            ),
            (
                course_map['python'],
                'How does Python determine blocks of code inside functions, loops, or conditionals?',
                'Curly braces {}', 'Parentheses ()', 'Indentation (whitespace)', 'Semicolons ;',
                2,
                'Python relies strictly on indentation (leading whitespace) to delimit code blocks.'
            ),

            # Introduction to AI questions
            (
                course_map['ai'],
                'What is the primary mission of UN Sustainable Development Goal 4 (SDG 4)?',
                'Industrial Automation & Robotics',
                'Inclusive and Equitable Quality Education for All',
                'Deep Ocean Exploration & Marine Biology',
                'Global Space Colonization',
                1,
                'SDG 4 aims to ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.'
            ),
            (
                course_map['ai'],
                'Which branch of AI focuses on algorithms that learn and improve from experience without explicit reprogramming?',
                'Cloud Hosting', 'Machine Learning', 'Database Normalization', 'Network Routing',
                1,
                'Machine Learning is a subset of AI where computers analyze datasets to learn patterns automatically.'
            ),
            (
                course_map['ai'],
                'What is the dataset called that is used to train and calibrate a Machine Learning model?',
                'Training Set', 'Cache Memory', 'Index Buffer', 'Binary Heap',
                0,
                'The training set is the sample data provided to the algorithm to fit models and identify patterns.'
            ),
            (
                course_map['ai'],
                'Why is ethical AI essential in modern educational systems and technologies?',
                'To replace all human teachers entirely',
                'To ensure fairness, prevent algorithmic bias, and protect student privacy',
                'To make exams unreasonably difficult for students',
                'To reduce computer memory speeds',
                1,
                'Ethical AI guarantees transparency, eliminates bias, and protects sensitive learner data and equity.'
            ),
            (
                course_map['ai'],
                'Which essential hardware component performs arithmetic and logical calculations as the "brain" of a computer?',
                'RAM (Memory)', 'Hard Drive', 'Monitor', 'CPU (Central Processing Unit)',
                3,
                'The CPU (Central Processing Unit) executes program instructions and processes calculations.'
            )
        ]

        cursor.executemany('''
            INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_questions)

        # Seed an initial sample practice attempt
        cursor.execute('''
            INSERT INTO practice_attempts (course_id, score, total_questions, correct_answers, percentage, completed_at)
            VALUES (?, ?, ?, ?, ?, datetime('now', '-1 day'))
        ''', (course_map['html-css'], 5, 5, 5, 100.0))

    conn.commit()
    conn.close()

# Initialize the database on startup
init_db()

# ==============================================================================
# Frontend Routes
# ==============================================================================

@app.route('/')
def index():
    """Serve the existing frontend homepage."""
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve existing frontend assets (style.css, script.js, images)."""
    return send_from_directory(FRONTEND_DIR, filename)

# ==============================================================================
# API Endpoints
# ==============================================================================

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Retrieve available courses along with question counts."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.id, c.slug, c.title, c.description, c.level, c.topics,
               COUNT(q.id) as question_count
        FROM courses c
        LEFT JOIN questions q ON c.id = q.course_id
        GROUP BY c.id
        ORDER BY c.id ASC
    ''')
    rows = cursor.fetchall()
    conn.close()

    courses = []
    for r in rows:
        try:
            topics = json.loads(r['topics'])
        except Exception:
            topics = []
        courses.append({
            'id': r['id'],
            'slug': r['slug'],
            'title': r['title'],
            'description': r['description'],
            'level': r['level'],
            'topics': topics,
            'question_count': r['question_count']
        })

    return jsonify({'success': True, 'courses': courses})

@app.route('/api/courses/<course_identifier>/questions', methods=['GET'])
def get_course_questions(course_identifier):
    """
    Retrieve questions for a course WITHOUT exposing correct answers or explanations.
    Accepts course slug (e.g. 'html-css', 'ai', 'all') or integer ID.
    """
    conn = get_db()
    cursor = conn.cursor()

    course_info = None

    if course_identifier == 'all':
        # Return 5 balanced questions representing SDG 4 & foundational skills
        cursor.execute('''
            SELECT q.id, q.course_id, c.title as course_title, q.question_text,
                   q.option_a, q.option_b, q.option_c, q.option_d
            FROM questions q
            JOIN courses c ON q.course_id = c.id
            GROUP BY c.id
            LIMIT 5
        ''')
        course_info = {
            'id': 0,
            'slug': 'all',
            'title': 'General Knowledge & SDG 4'
        }
    elif course_identifier.isdigit():
        cursor.execute('SELECT * FROM courses WHERE id = ?', (int(course_identifier),))
        course_row = cursor.fetchone()
        if not course_row:
            conn.close()
            return jsonify({'success': False, 'error': 'Course not found'}), 404
        course_info = {'id': course_row['id'], 'slug': course_row['slug'], 'title': course_row['title']}
        cursor.execute('''
            SELECT q.id, q.course_id, c.title as course_title, q.question_text,
                   q.option_a, q.option_b, q.option_c, q.option_d
            FROM questions q
            JOIN courses c ON q.course_id = c.id
            WHERE q.course_id = ?
            ORDER BY q.id ASC
        ''', (course_row['id'],))
    else:
        cursor.execute('SELECT * FROM courses WHERE slug = ?', (course_identifier,))
        course_row = cursor.fetchone()
        if not course_row:
            conn.close()
            return jsonify({'success': False, 'error': 'Course not found'}), 404
        course_info = {'id': course_row['id'], 'slug': course_row['slug'], 'title': course_row['title']}
        cursor.execute('''
            SELECT q.id, q.course_id, c.title as course_title, q.question_text,
                   q.option_a, q.option_b, q.option_c, q.option_d
            FROM questions q
            JOIN courses c ON q.course_id = c.id
            WHERE q.course_id = ?
            ORDER BY q.id ASC
        ''', (course_row['id'],))

    rows = cursor.fetchall()
    conn.close()

    questions = []
    for r in rows:
        questions.append({
            'id': r['id'],
            'course_id': r['course_id'],
            'course_title': r['course_title'],
            'question_text': r['question_text'],
            'options': [
                r['option_a'],
                r['option_b'],
                r['option_c'],
                r['option_d']
            ]
        })

    return jsonify({
        'success': True,
        'course': course_info,
        'questions': questions
    })

@app.route('/api/submit-answer', methods=['POST'])
def submit_single_answer():
    """
    Validate a single answer and return feedback and explanation.
    Expected JSON: { "question_id": int, "selected_option": int }
    """
    data = request.get_json(silent=True) or {}
    question_id = data.get('question_id')
    selected_option = data.get('selected_option')

    if question_id is None or selected_option is None:
        return jsonify({'success': False, 'error': 'Missing question_id or selected_option'}), 400

    try:
        q_id = int(question_id)
        sel_opt = int(selected_option)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid question_id or selected_option format'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT correct_option, explanation FROM questions WHERE id = ?', (q_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'success': False, 'error': 'Question not found'}), 404

    correct_option = row['correct_option']
    explanation = row['explanation']
    is_correct = (sel_opt == correct_option)

    return jsonify({
        'success': True,
        'question_id': q_id,
        'is_correct': is_correct,
        'correct_option': correct_option,
        'explanation': explanation
    })

@app.route('/api/finish-course', methods=['POST'])
def finish_course():
    """
    Calculate and save final quiz score on the server.
    Expected JSON: {
        "course_id": "html-css" (or int/all),
        "answers": [ { "question_id": int, "selected_option": int }, ... ]
    }
    """
    data = request.get_json(silent=True) or {}
    course_identifier = data.get('course_id', 'all')
    submitted_answers = data.get('answers', [])

    if not isinstance(submitted_answers, list) or len(submitted_answers) == 0:
        return jsonify({'success': False, 'error': 'No answers submitted'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Identify course
    course_db_id = None
    course_title = 'General Knowledge'

    if str(course_identifier).isdigit():
        cursor.execute('SELECT id, title FROM courses WHERE id = ?', (int(course_identifier),))
        c = cursor.fetchone()
        if c:
            course_db_id = c['id']
            course_title = c['title']
    elif course_identifier != 'all':
        cursor.execute('SELECT id, title FROM courses WHERE slug = ?', (course_identifier,))
        c = cursor.fetchone()
        if c:
            course_db_id = c['id']
            course_title = c['title']

    if course_db_id is None:
        # Fallback to the first course if 'all' or not found
        cursor.execute('SELECT id, title FROM courses LIMIT 1')
        first_course = cursor.fetchone()
        course_db_id = first_course['id'] if first_course else 1
        if course_identifier == 'all':
            course_title = 'All Topics / SDG 4'

    # Validate answers against actual DB records
    score = 0
    total = len(submitted_answers)
    answer_records = []

    for item in submitted_answers:
        q_id = item.get('question_id')
        sel_opt = item.get('selected_option')
        if q_id is None or sel_opt is None:
            continue

        try:
            q_id = int(q_id)
            sel_opt = int(sel_opt)
        except (ValueError, TypeError):
            continue

        cursor.execute('SELECT correct_option, explanation FROM questions WHERE id = ?', (q_id,))
        q_row = cursor.fetchone()
        if q_row:
            is_correct = 1 if (sel_opt == q_row['correct_option']) else 0
            if is_correct:
                score += 1
            answer_records.append({
                'question_id': q_id,
                'selected_option': sel_opt,
                'is_correct': is_correct,
                'correct_option': q_row['correct_option'],
                'explanation': q_row['explanation']
            })

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    # Save to practice_attempts
    cursor.execute('''
        INSERT INTO practice_attempts (course_id, score, total_questions, correct_answers, percentage, completed_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (course_db_id, score, total, score, percentage, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))

    attempt_id = cursor.lastrowid

    # Save detailed answers to student_answers
    for ans in answer_records:
        cursor.execute('''
            INSERT INTO student_answers (attempt_id, question_id, selected_option, is_correct)
            VALUES (?, ?, ?, ?)
        ''', (attempt_id, ans['question_id'], ans['selected_option'], ans['is_correct']))

    conn.commit()
    conn.close()

    # Generate personalized result message
    if percentage == 100.0:
        result_title = f"Outstanding Score! ({score}/{total})"
        result_msg = f"Perfect! You have completely mastered the {course_title} concepts."
    elif percentage >= 60.0:
        result_title = f"Great Job! ({score}/{total})"
        result_msg = f"Solid performance in {course_title}! You know the key fundamentals well."
    else:
        result_title = f"Keep Practicing! ({score}/{total})"
        result_msg = f"Continuous learning is the heart of SDG 4. Review the {course_title} topics and try again!"

    return jsonify({
        'success': True,
        'attempt_id': attempt_id,
        'course_title': course_title,
        'score': score,
        'total': total,
        'correct_answers': score,
        'percentage': percentage,
        'title': result_title,
        'message': result_msg,
        'detailed_feedback': answer_records
    })

@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Retrieve saved student practice attempts and aggregate statistics."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT p.id, p.score, p.total_questions, p.percentage, p.completed_at,
               c.title as course_title, c.slug as course_slug
        FROM practice_attempts p
        JOIN courses c ON p.course_id = c.id
        ORDER BY p.id DESC
        LIMIT 10
    ''')
    rows = cursor.fetchall()

    cursor.execute('''
        SELECT COUNT(*) as total_attempts,
               COALESCE(AVG(percentage), 0) as avg_percentage,
               COALESCE(MAX(percentage), 0) as best_percentage
        FROM practice_attempts
    ''')
    summary = cursor.fetchone()
    conn.close()

    recent = []
    for r in rows:
        recent.append({
            'id': r['id'],
            'course_title': r['course_title'],
            'course_slug': r['course_slug'],
            'score': r['score'],
            'total_questions': r['total_questions'],
            'percentage': round(r['percentage'], 1),
            'completed_at': str(r['completed_at'])
        })

    return jsonify({
        'success': True,
        'total_attempts': summary['total_attempts'],
        'average_percentage': round(summary['avg_percentage'], 1),
        'best_percentage': round(summary['best_percentage'], 1),
        'recent_attempts': recent
    })

# ==============================================================================
# Global Error Handlers
# ==============================================================================

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Endpoint not found'}), 404
    return send_from_directory(FRONTEND_DIR, 'index.html'), 200

@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'error': 'An internal server error occurred.'}), 500

if __name__ == '__main__':
    print("=" * 65)
    print("EduSmart – Quality Education (Flask + SQLite Server)")
    print(f"Serving frontend from: {FRONTEND_DIR}")
    print(f"Database location: {DB_PATH}")
    print("Running locally at: http://127.0.0.1:5000")
    print("=" * 65)
    app.run(host='127.0.0.1', port=5000, debug=True)
