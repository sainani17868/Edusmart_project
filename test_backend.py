import os
import json
import sqlite3
from app import app, init_db, DB_PATH

def run_tests():
    print("========================================")
    print("RUNNING EDUSMART FLASK & SQLITE TESTS")
    print("========================================")

    init_db()
    client = app.test_client()

    # 1. Test GET / (Serve existing frontend homepage)
    res = client.get('/')
    assert res.status_code == 200, f"GET / failed: {res.status_code}"
    assert b"EduSmart" in res.data, "GET / missing EduSmart title"
    print("[PASS] GET / serves frontend homepage successfully")

    # 2. Test GET /style.css and GET /script.js
    res_css = client.get('/style.css')
    assert res_css.status_code == 200, "GET /style.css failed"
    res_js = client.get('/script.js')
    assert res_js.status_code == 200, "GET /script.js failed"
    print("[PASS] Static assets (style.css, script.js) served cleanly")

    # 3. Test GET /api/courses
    res = client.get('/api/courses')
    assert res.status_code == 200, "GET /api/courses failed"
    data = res.get_json()
    assert data['success'] is True, "Courses API success flag false"
    courses = data['courses']
    assert len(courses) == 4, f"Expected 4 courses, got {len(courses)}"
    slugs = [c['slug'] for c in courses]
    assert 'html-css' in slugs and 'javascript' in slugs and 'python' in slugs and 'ai' in slugs
    print(f"[PASS] GET /api/courses returned {len(courses)} courses: {slugs}")

    # 4. Test GET /api/courses/<id>/questions (SECURITY CHECK: NO ANSWERS EXPOSED)
    res = client.get('/api/courses/html-css/questions')
    assert res.status_code == 200, "GET questions failed"
    q_data = res.get_json()
    assert q_data['success'] is True
    questions = q_data['questions']
    assert len(questions) == 5, f"Expected 5 questions, got {len(questions)}"
    for q in questions:
        assert 'correct_option' not in q, f"SECURITY VIOLATION: correct_option exposed in question {q['id']}"
        assert 'explanation' not in q, f"SECURITY VIOLATION: explanation exposed in question {q['id']}"
        assert len(q['options']) == 4, f"Expected 4 options, got {len(q['options'])}"
    print("[PASS] GET /api/courses/html-css/questions returned 5 questions with correct answers strictly HIDDEN")

    # 5. Test POST /api/submit-answer
    first_q_id = questions[0]['id']
    # Submit correct answer (for question 1 HTML hyperlink, correct is index 2 '<a>')
    res = client.post('/api/submit-answer',
                      data=json.dumps({'question_id': first_q_id, 'selected_option': 2}),
                      content_type='application/json')
    assert res.status_code == 200, "Submit answer failed"
    ans_data = res.get_json()
    assert ans_data['success'] is True
    assert ans_data['is_correct'] is True
    assert 'explanation' in ans_data
    print("[PASS] POST /api/submit-answer validated correct option and returned explanation")

    # Submit incorrect answer
    res_inc = client.post('/api/submit-answer',
                          data=json.dumps({'question_id': first_q_id, 'selected_option': 0}),
                          content_type='application/json')
    assert res_inc.get_json()['is_correct'] is False
    print("[PASS] POST /api/submit-answer correctly flagged wrong answer")

    # 6. Test POST /api/finish-course (Server-side score calculation & SQLite save)
    # Course 1 correct answers: Q1: 2, Q2: 0, Q3: 2, Q4: 3, Q5: 0
    all_answers = [
        {'question_id': questions[0]['id'], 'selected_option': 2},
        {'question_id': questions[1]['id'], 'selected_option': 0},
        {'question_id': questions[2]['id'], 'selected_option': 2},
        {'question_id': questions[3]['id'], 'selected_option': 3},
        {'question_id': questions[4]['id'], 'selected_option': 0}
    ]
    res_finish = client.post('/api/finish-course',
                             data=json.dumps({'course_id': 'html-css', 'answers': all_answers}),
                             content_type='application/json')
    assert res_finish.status_code == 200, "Finish course failed"
    fin_data = res_finish.get_json()
    assert fin_data['success'] is True
    assert fin_data['score'] == 5, f"Expected score 5, got {fin_data['score']}"
    assert fin_data['percentage'] == 100.0
    attempt_id = fin_data['attempt_id']
    print(f"[PASS] POST /api/finish-course calculated score on server ({fin_data['score']}/5 = 100%) and saved attempt #{attempt_id}")

    # 7. Test GET /api/progress
    res_prog = client.get('/api/progress')
    assert res_prog.status_code == 200, "GET /api/progress failed"
    prog_data = res_prog.get_json()
    assert prog_data['success'] is True
    assert prog_data['total_attempts'] >= 2, f"Expected at least 2 attempts, got {prog_data['total_attempts']}"
    assert len(prog_data['recent_attempts']) >= 2
    print(f"[PASS] GET /api/progress returned updated stats: Total Attempts = {prog_data['total_attempts']}, Avg = {prog_data['average_percentage']}%")

    # 8. Test Database Persistence
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM practice_attempts WHERE id = ?', (attempt_id,))
    count = c.fetchone()[0]
    assert count == 1, "Attempt record not found in SQLite file"
    c.execute('SELECT COUNT(*) FROM student_answers WHERE attempt_id = ?', (attempt_id,))
    ans_count = c.fetchone()[0]
    assert ans_count == 5, f"Expected 5 student answers recorded, got {ans_count}"
    conn.close()
    print("[PASS] SQLite database verification confirmed persistence of attempts and answers")

    print("========================================")
    print("ALL 8 BACKEND AND DATABASE TESTS PASSED!")
    print("========================================")

if __name__ == '__main__':
    run_tests()
