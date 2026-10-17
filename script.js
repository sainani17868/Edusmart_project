document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Navigation Toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }

  // --- Active Navigation Link on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const targetNavLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

      if (targetNavLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          targetNavLink.classList.add('active');
        } else {
          targetNavLink.classList.remove('active');
        }
      }
    });
  });

  // --- Course Information Modal ---
  const courseData = {
    'html-css': {
      title: 'HTML & CSS Web Fundamentals',
      desc: 'Learn how to structure and style accessible, modern, and responsive web pages from the ground up.',
      topics: [
        'Semantic HTML elements, links, and forms',
        'CSS syntax, colors, typography, and box model',
        'Modern Flexbox and CSS Grid layout techniques',
        'Responsive mobile-first media queries'
      ],
      note: 'Tip: Create a personal mini-portfolio project to practice your web design skills!'
    },
    'javascript': {
      title: 'JavaScript Basics',
      desc: 'Bring your websites to life with client-side interactivity, logic, and browser APIs.',
      topics: [
        'Variables, data types, and logical operators',
        'Functions, conditional statements, and loops',
        'DOM element selection and event listeners',
        'Interactive forms, dynamic content, and animations'
      ],
      note: 'Tip: Press F12 in your browser to open Developer Tools and test JavaScript commands in real time!'
    },
    'python': {
      title: 'Python Programming',
      desc: 'Discover why Python is the leading beginner-friendly language for scripting, data analysis, and problem-solving.',
      topics: [
        'Clean syntax, variables, and data structures',
        'Conditional branching, loops, and list handling',
        'Writing reusable functions and modular code',
        'File input/output and introductory algorithmic thinking'
      ],
      note: 'Tip: Practice writing small scripts that automate everyday calculations or text sorting.'
    },
    'ai': {
      title: 'Introduction to Artificial Intelligence',
      desc: 'Gain a solid conceptual foundation of AI technologies and their transformative impact on education and society.',
      topics: [
        'Core concepts: Artificial Intelligence, Machine Learning, and Data',
        'How pattern recognition works in computers',
        'Ethical AI, fairness, privacy, and societal impact',
        'AI applications in personalized education and tutoring'
      ],
      note: 'Tip: Responsible use and critical thinking are essential skills when interacting with AI tools.'
    }
  };

  let activeModalCourse = 'html-css';
  const courseModal = document.getElementById('course-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');
  const modalPracticeBtn = document.getElementById('modal-practice-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-description');
  const modalTopicsList = document.getElementById('modal-topics-list');
  const modalNote = document.getElementById('modal-note');

  function openCourseModal(courseKey) {
    activeModalCourse = courseKey;
    const data = courseData[courseKey];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.desc;
    modalNote.textContent = data.note;

    modalTopicsList.innerHTML = '';
    data.topics.forEach(topic => {
      const li = document.createElement('li');
      li.textContent = topic;
      modalTopicsList.appendChild(li);
    });

    courseModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCourseModal() {
    courseModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.learn-more-btn').forEach(button => {
    button.addEventListener('click', () => {
      const courseKey = button.getAttribute('data-course');
      openCourseModal(courseKey);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCourseModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener('click', closeCourseModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeCourseModal);

  // Connect modal "Practice This Course" button to the quiz practice section
  if (modalPracticeBtn) {
    modalPracticeBtn.addEventListener('click', () => {
      closeCourseModal();
      switchQuizCourse(activeModalCourse);
      const quizSection = document.getElementById('quiz');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !courseModal.classList.contains('hidden')) {
      closeCourseModal();
    }
  });

  // ============================================================================
  // --- Quiz & Backend Practice Integration (Flask API + SQLite) ---
  // ============================================================================

  let currentQuestions = [];
  let currentCourseSlug = 'all';

  const quizForm = document.getElementById('quiz-form');
  const questionsContainer = document.getElementById('questions-container');
  const quizResult = document.getElementById('quiz-result');
  const scoreDisplay = document.getElementById('score-display');
  const totalDisplay = document.getElementById('total-display');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  const restartQuizBtn = document.getElementById('restart-quiz-btn');
  const quizPills = document.querySelectorAll('.quiz-pill');

  // Fallback questions for offline / static browser mode
  const staticFallbackQuestions = [
    {
      id: 1,
      question_text: 'What is the primary focus of UN Sustainable Development Goal 4 (SDG 4)?',
      options: [
        'Industrial Automation & Robotics',
        'Inclusive and Equitable Quality Education for All',
        'Deep Ocean Exploration & Marine Biology',
        'Global Space Colonization'
      ]
    },
    {
      id: 2,
      question_text: 'Which HTML tag is used to create a hyperlink on a webpage?',
      options: ['<link>', '<href>', '<a>', '<hyper>']
    },
    {
      id: 3,
      question_text: 'What does CSS stand for in web development?',
      options: [
        'Cascading Style Sheets',
        'Computer Standard Syntax',
        'Creative System Styling',
        'Centralized Sheet Structure'
      ]
    },
    {
      id: 4,
      question_text: 'Which hardware component is commonly known as the "brain" of a computer?',
      options: ['RAM (Random Access Memory)', 'Hard Disk Drive (HDD)', 'Monitor', 'CPU (Central Processing Unit)']
    },
    {
      id: 5,
      question_text: 'Why is lifelong and inclusive learning vital for sustainable development?',
      options: [
        'It empowers individuals, reduces poverty, and fosters equitable societies',
        'It is only beneficial for software developers',
        'It eliminates the requirement of practical hands-on experience',
        'It is only needed until someone completes high school'
      ]
    }
  ];

  // Render question cards inside questions-container
  function renderQuestions(questions) {
    currentQuestions = questions;
    if (!questionsContainer) return;

    questionsContainer.innerHTML = '';

    questions.forEach((q, index) => {
      const qBlock = document.createElement('div');
      qBlock.className = 'question-block';
      qBlock.setAttribute('data-qid', q.id);

      const qText = document.createElement('h4');
      qText.className = 'question-text';
      qText.innerHTML = `<span class="q-num">${index + 1}.</span> ${escapeHtml(q.question_text)}`;
      qBlock.appendChild(qText);

      const optionsGroup = document.createElement('div');
      optionsGroup.className = 'options-group';

      q.options.forEach((optText, optIndex) => {
        const label = document.createElement('label');
        label.className = 'option-label';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q_${q.id}`;
        radio.value = optIndex;

        const customRadio = document.createElement('span');
        customRadio.className = 'custom-radio';

        const optionTextSpan = document.createElement('span');
        optionTextSpan.className = 'option-text';
        optionTextSpan.textContent = optText;

        label.appendChild(radio);
        label.appendChild(customRadio);
        label.appendChild(optionTextSpan);

        radio.addEventListener('change', () => {
          optionsGroup.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
          if (radio.checked) {
            label.classList.add('selected');
            // Validate single answer via API for instant feedback
            validateSingleAnswer(q.id, optIndex, qBlock);
          }
        });

        optionsGroup.appendChild(label);
      });

      qBlock.appendChild(optionsGroup);

      // Feedback / explanation box
      const feedbackBox = document.createElement('div');
      feedbackBox.className = 'question-feedback';
      feedbackBox.id = `feedback_${q.id}`;
      qBlock.appendChild(feedbackBox);

      questionsContainer.appendChild(qBlock);
    });

    if (totalDisplay) {
      totalDisplay.textContent = questions.length;
    }
  }

  // Validate single selected answer on backend
  async function validateSingleAnswer(questionId, selectedOption, qBlock) {
    try {
      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          selected_option: selectedOption
        })
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        const feedbackBox = qBlock.querySelector('.question-feedback');
        if (feedbackBox) {
          feedbackBox.className = `question-feedback show ${result.is_correct ? 'correct' : 'incorrect'}`;
          feedbackBox.innerHTML = `
            <strong>${result.is_correct ? '✓ Correct!' : '✗ Not quite.'}</strong> ${escapeHtml(result.explanation)}
          `;
        }
      }
    } catch (err) {
      // In offline / static mode, gracefully ignore background error
    }
  }

  // Load questions for a specific course from Flask API
  async function loadCourseQuestions(courseSlug) {
    currentCourseSlug = courseSlug;

    // Update active pill styling
    quizPills.forEach(pill => {
      if (pill.getAttribute('data-course') === courseSlug) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    try {
      const response = await fetch(`/api/courses/${courseSlug}/questions`);
      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      if (data.success && data.questions && data.questions.length > 0) {
        renderQuestions(data.questions);
      } else {
        renderQuestions(staticFallbackQuestions);
      }
    } catch (err) {
      // Fallback for static file preview
      renderQuestions(staticFallbackQuestions);
    }

    // Reset quiz visibility
    if (quizResult) quizResult.classList.add('hidden');
    if (quizForm) quizForm.style.display = 'block';
  }

  function switchQuizCourse(courseSlug) {
    loadCourseQuestions(courseSlug);
  }

  // Attach pill click events
  quizPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const courseSlug = pill.getAttribute('data-course');
      switchQuizCourse(courseSlug);
    });
  });

  // Submit full quiz to server for verified score calculation and persistence
  if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentQuestions || currentQuestions.length === 0) return;

      const answers = [];
      currentQuestions.forEach(q => {
        const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (selected) {
          answers.push({
            question_id: q.id,
            selected_option: parseInt(selected.value, 10)
          });
        }
      });

      if (answers.length < currentQuestions.length) {
        alert(`You answered ${answers.length} of ${currentQuestions.length} questions. Please select an answer for each question before submitting.`);
        return;
      }

      // Submit to Flask backend
      try {
        const response = await fetch('/api/finish-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: currentCourseSlug,
            answers: answers
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            displayQuizResult(result.score, result.total, result.title, result.message);
            // Refresh database progress records
            loadStudentProgress();
            return;
          }
        }
      } catch (err) {
        // Fallback calculation for offline testing
      }

      // Offline fallback calculation if server was unreachable
      let fallbackScore = 0;
      answers.forEach(ans => {
        if ([1, 2, 0, 3, 0].includes(ans.selected_option)) {
          fallbackScore++;
        }
      });

      displayQuizResult(
        fallbackScore,
        currentQuestions.length,
        `Completed! (${fallbackScore}/${currentQuestions.length})`,
        'Great practice session! (Start Flask server at http://127.0.0.1:5000 to save attempts to SQLite).'
      );
    });
  }

  function displayQuizResult(score, total, title, message) {
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (totalDisplay) totalDisplay.textContent = total;
    if (resultTitle) resultTitle.textContent = title;
    if (resultMessage) resultMessage.textContent = message;

    if (quizForm) quizForm.style.display = 'none';
    if (quizResult) {
      quizResult.classList.remove('hidden');
      quizResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  if (restartQuizBtn) {
    restartQuizBtn.addEventListener('click', () => {
      loadCourseQuestions(currentCourseSlug);
      const quizSection = document.getElementById('quiz');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ============================================================================
  // --- Student Progress Dashboard (GET /api/progress) ---
  // ============================================================================

  const statAttempts = document.getElementById('stat-attempts');
  const statAvg = document.getElementById('stat-avg');
  const statBest = document.getElementById('stat-best');
  const recentAttemptsList = document.getElementById('recent-attempts-list');
  const refreshProgressBtn = document.getElementById('refresh-progress-btn');

  async function loadStudentProgress() {
    if (!recentAttemptsList) return;

    try {
      const response = await fetch('/api/progress');
      if (!response.ok) throw new Error('Progress API not reachable');

      const data = await response.json();
      if (!data.success) return;

      if (statAttempts) statAttempts.textContent = data.total_attempts;
      if (statAvg) statAvg.textContent = `${data.average_percentage}%`;
      if (statBest) statBest.textContent = `${data.best_percentage}%`;

      if (!data.recent_attempts || data.recent_attempts.length === 0) {
        recentAttemptsList.innerHTML = '<p class="empty-state">No practice sessions recorded yet. Complete a quiz to track your progress!</p>';
        return;
      }

      recentAttemptsList.innerHTML = '';
      data.recent_attempts.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'attempt-item';

        let badgeClass = 'high';
        if (item.percentage < 50) badgeClass = 'low';
        else if (item.percentage < 80) badgeClass = 'medium';

        itemEl.innerHTML = `
          <div>
            <span class="attempt-course">${escapeHtml(item.course_title)}</span>
            <div class="attempt-date">${escapeHtml(item.completed_at)}</div>
          </div>
          <span class="attempt-score ${badgeClass}">${item.score}/${item.total_questions} (${item.percentage}%)</span>
        `;
        recentAttemptsList.appendChild(itemEl);
      });
    } catch (err) {
      if (recentAttemptsList) {
        recentAttemptsList.innerHTML = '<p class="empty-state">Connect to Flask server (http://127.0.0.1:5000) to view live SQLite progress records.</p>';
      }
    }
  }

  if (refreshProgressBtn) {
    refreshProgressBtn.addEventListener('click', loadStudentProgress);
  }

  // ============================================================================
  // --- Contact Form Validation & Demo Feedback ---
  // ============================================================================

  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');
  const contactFeedback = document.getElementById('contact-feedback');

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  function clearErrors() {
    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
    if (messageError) messageError.textContent = '';
    if (nameInput) nameInput.closest('.form-group').classList.remove('error');
    if (emailInput) emailInput.closest('.form-group').classList.remove('error');
    if (messageInput) messageInput.closest('.form-group').classList.remove('error');
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();
      if (contactFeedback) contactFeedback.classList.add('hidden');

      let isValid = true;
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      if (!nameVal) {
        if (nameError) nameError.textContent = 'Please enter your full name.';
        if (nameInput) nameInput.closest('.form-group').classList.add('error');
        isValid = false;
      } else if (nameVal.length < 2) {
        if (nameError) nameError.textContent = 'Name must be at least 2 characters long.';
        if (nameInput) nameInput.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (!emailVal) {
        if (emailError) emailError.textContent = 'Please enter your email address.';
        if (emailInput) emailInput.closest('.form-group').classList.add('error');
        isValid = false;
      } else if (!validateEmail(emailVal)) {
        if (emailError) emailError.textContent = 'Please enter a valid email format (e.g., student@example.com).';
        if (emailInput) emailInput.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (!messageVal) {
        if (messageError) messageError.textContent = 'Please write a message before submitting.';
        if (messageInput) messageInput.closest('.form-group').classList.add('error');
        isValid = false;
      } else if (messageVal.length < 10) {
        if (messageError) messageError.textContent = 'Message should contain at least 10 characters.';
        if (messageInput) messageInput.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (isValid && contactFeedback) {
        contactFeedback.className = 'feedback-box success';
        contactFeedback.innerHTML = `
          <strong>Message Received!</strong><br>
          Thank you, <strong>${escapeHtml(nameVal)}</strong>. Your contact submission has been validated successfully.<br>
          <small><em>(Demonstration Form: Validated locally in your browser.)</em></small>
        `;
        contactFeedback.classList.remove('hidden');
        contactForm.reset();
      }
    });
  }

  function escapeHtml(string) {
    if (!string) return '';
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  // Initialize questions and progress dashboard on page load
  loadCourseQuestions('all');
  loadStudentProgress();
});
