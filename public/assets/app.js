/* ==========================================
   Sankalp Digital Pathshala - Upgraded App Logic System v2.2
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Upgraded Left-Right Sliding Background Hero (5 Slides) ---
  const slides = document.querySelectorAll('.hero-slider .slide');
  if (slides.length > 0) {
    let currentSlide = 0;
    
    // Initialize the first slide
    slides[0].classList.add('active');
    
    setInterval(() => {
      const prevSlide = currentSlide;
      currentSlide = (currentSlide + 1) % slides.length;
      
      slides.forEach((slide, idx) => {
        slide.classList.remove('exit');
        if (idx === prevSlide) {
          slide.classList.remove('active');
          slide.classList.add('exit');
        } else if (idx === currentSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    }, 5000);
  }

  // --- Scroll Reveal Intersection Observers ---
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });
    
    reveals.forEach(r => revealObserver.observe(r));
  }

  // --- Mobile Hamburger Navigation Accessibility ---
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menuToggle && menuToggle.checked) {
        menuToggle.checked = false; // Close menu on click
      }
    });
  });

  // --- Dynamic Counter Animation (Home Page Stats) ---
  const counters = document.querySelectorAll('.stat-item h3');
  if (counters.length > 0) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const countTo = parseInt(entry.target.getAttribute('data-count'), 10) || 0;
          let count = 0;
          const duration = 2000; // 2 seconds
          const stepTime = Math.abs(Math.floor(duration / countTo));
          
          const timer = setInterval(() => {
            count += Math.ceil(countTo / 100);
            if (count >= countTo) {
              entry.target.textContent = countTo + (entry.target.getAttribute('data-suffix') || '');
              clearInterval(timer);
            } else {
              entry.target.textContent = count + (entry.target.getAttribute('data-suffix') || '');
            }
          }, stepTime > 10 ? stepTime : 10);
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
  }

  // --- Tab System (Study Material, AI Assistant) ---
  const tabContainers = document.querySelectorAll('.tab-container');
  tabContainers.forEach(container => {
    const buttons = container.querySelectorAll('.tab-btn');
    const panels = container.querySelectorAll('.tab-content');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetPanel = container.querySelector(`#${targetId}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  });

  // --- Testimonial Carousel Logic ---
  const testimonialTrack = document.getElementById('testimonialTrack');
  const testimonialSlides = document.querySelectorAll('.testimonial-slide');
  const carouselIndicators = document.getElementById('carouselIndicators');
  
  if (testimonialTrack && testimonialSlides.length > 0) {
    let currentIdx = 0;
    
    // Generate dots
    testimonialSlides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        currentIdx = index;
        updateTestimonials();
      });
      carouselIndicators.appendChild(dot);
    });

    const dots = carouselIndicators.querySelectorAll('.carousel-dot');

    function updateTestimonials() {
      testimonialTrack.style.transform = `translateX(-${currentIdx * 100}%)`;
      dots.forEach((dot, idx) => {
        if (idx === currentIdx) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }

    // Auto rotate testimonials
    setInterval(() => {
      currentIdx = (currentIdx + 1) % testimonialSlides.length;
      updateTestimonials();
    }, 6000);
  }

  // --- FAQ Accordion Logic ---
  const faqHeaders = document.querySelectorAll('.faq-header');
  faqHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.faq-body');
      
      const isOpen = item.classList.contains('active');
      
      // Close all other items
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-body').style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // --- Contact Form Submission ---
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span>Sending...`;

      const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        mobile: document.getElementById('mobile').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          contactForm.reset();
        } else {
          alert(data.error || 'Something went wrong.');
        }
      } catch (err) {
        alert('Network error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // --- Enroll Multi-step Form ---
  const enrollForm = document.getElementById('enrollForm');
  if (enrollForm) {
    const steps = Array.from(enrollForm.querySelectorAll('.form-step'));
    const stepIndicators = Array.from(document.querySelectorAll('.step-indicators .step-item'));
    const btnNext = document.getElementById('btnNext');
    const btnPrev = document.getElementById('btnPrev');
    let currentStep = 0;

    function updateFormSteps() {
      steps.forEach((step, idx) => {
        if (idx === currentStep) step.classList.add('active');
        else step.classList.remove('active');
      });

      stepIndicators.forEach((ind, idx) => {
        if (idx === currentStep) {
          ind.classList.add('active');
          ind.classList.remove('completed');
        } else if (idx < currentStep) {
          ind.classList.add('completed');
          ind.classList.remove('active');
        } else {
          ind.classList.remove('active', 'completed');
        }
      });

      // Handle Buttons
      if (currentStep === 0) {
        btnPrev.style.visibility = 'hidden';
      } else {
        btnPrev.style.visibility = 'visible';
      }

      if (currentStep === steps.length - 1) {
        btnNext.textContent = 'Submit Enrollment';
      } else {
        btnNext.textContent = 'Next Step';
      }
    }

    btnNext.addEventListener('click', async () => {
      // Basic input validation for current step
      const currentFields = steps[currentStep].querySelectorAll('[required]');
      let valid = true;
      currentFields.forEach(f => {
        if (!f.value.trim()) {
          f.style.borderColor = 'var(--danger)';
          valid = false;
        } else {
          f.style.borderColor = 'var(--border)';
        }
      });

      if (!valid) {
        alert('Please fill out all required fields.');
        return;
      }

      if (currentStep < steps.length - 1) {
        currentStep++;
        updateFormSteps();
      } else {
        // Form Submission
        const submitBtn = btnNext;
        const origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span>Submitting...`;

        const enrollmentData = {
          firstName: document.getElementById('firstName').value,
          class: document.getElementById('studentClass').value,
          interest: document.getElementById('interest').value,
          phone: document.getElementById('phone').value,
          city: document.getElementById('city').value,
          parentName: document.getElementById('parentName').value,
          email: document.getElementById('email').value
        };

        try {
          const response = await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrollmentData)
          });

          const data = await response.json();
          if (response.ok) {
            alert(data.message);
            window.location.href = '/';
          } else {
            alert(data.error || 'Failed to submit enrollment.');
          }
        } catch (err) {
          alert('Network connection error.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });

    btnPrev.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateFormSteps();
      }
    });

    updateFormSteps();
  }

  // --- Dynamic Programs Loading ---
  const homeProgramsContainer = document.getElementById('featuredProgramsContainer');
  const coursesProgramsContainer = document.getElementById('coursesProgramsContainer');

  async function loadPrograms() {
    const container = homeProgramsContainer || coursesProgramsContainer;
    if (!container) return;

    try {
      const response = await fetch('/api/public/programs');
      const list = await response.json();

      if (response.ok && list.length > 0) {
        container.innerHTML = '';
        const displayList = homeProgramsContainer ? list.slice(0, 3) : list; // limit to 3 on home

        displayList.forEach(prog => {
          const card = document.createElement('div');
          card.classList.add('program-card');
          card.innerHTML = `
            <div class="program-header">
              <span class="program-category">${prog.category}</span>
              <h3 style="color: var(--white);">${prog.title}</h3>
            </div>
            <div class="program-body">
              <p>${prog.description}</p>
              <ul class="program-features">
                ${prog.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <a href="/enroll.html" class="btn-primary text-center">Enroll Now</a>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.warn('Could not retrieve dynamic programs. Falling back to statically defined HTML structure.', err);
    }
  }
  loadPrograms();

  // --- Public Result Checker Logic ---
  const checkResultForm = document.getElementById('checkResultForm');
  const marksheetCard = document.getElementById('marksheetCard');

  if (checkResultForm) {
    checkResultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = checkResultForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span>Verifying...`;

      const regNo = document.getElementById('regNo').value;
      const dob = document.getElementById('dob').value;

      try {
        const response = await fetch('/api/result/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationNumber: regNo, dob })
        });

        const data = await response.json();
        if (response.ok) {
          // Render Marksheet
          document.getElementById('mStudentName').textContent = data.studentName;
          document.getElementById('mFatherName').textContent = data.fatherName;
          document.getElementById('mRegNo').textContent = data.registrationNumber;
          document.getElementById('mDob').textContent = data.dob;
          document.getElementById('mGrade').textContent = data.grade;
          document.getElementById('mRemarks').textContent = data.remarks || 'Excellent Performance';

          const photoElem = document.getElementById('mPhoto');
          if (data.photo) {
            photoElem.src = data.photo;
            photoElem.style.display = 'block';
          } else {
            photoElem.style.display = 'none';
          }

          marksheetCard.style.display = 'block';
          marksheetCard.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert(data.error || 'Record verification failed. Check Details.');
          marksheetCard.style.display = 'none';
        }
      } catch (err) {
        alert('Verification service error.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // --- AI Question Solver (Upload and text submission) ---
  const aiSolverForm = document.getElementById('aiSolverForm');
  const solverFileForm = document.getElementById('solverFileForm');

  async function handleSolverRequest(formElement, fileInputId, textInputId, outputContainerId, textContainerId) {
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = formElement.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span>Solving Question...`;

      const outputBox = document.getElementById(outputContainerId);
      const outputText = document.getElementById(textContainerId);
      
      const formData = new FormData();
      
      const txtInput = document.getElementById(textInputId);
      if (txtInput && txtInput.value.trim()) {
        formData.append('question', txtInput.value);
      }
      
      const fileInput = document.getElementById(fileInputId);
      if (fileInput && fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      }

      try {
        const response = await fetch('/api/solve-question', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          outputText.textContent = data.answer;
          outputBox.style.display = 'block';
          outputBox.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert(data.error || 'AI Solver could not parse question.');
        }
      } catch (err) {
        alert('Server network error. Verify file size and key configuration.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  if (aiSolverForm) {
    handleSolverRequest(aiSolverForm, '', 'solverText', 'aiSolutionBox', 'solutionContent');
  }
  if (solverFileForm) {
    // Standard file solver uses the general form
    handleSolverRequest(solverFileForm, 'solverFile', 'solverFileText', 'aiSolutionBoxFile', 'solutionContentFile');
  }

  // File Dropzone Visual Handler
  const dropzones = document.querySelectorAll('.file-dropzone');
  dropzones.forEach(zone => {
    const input = zone.querySelector('.file-input');
    zone.addEventListener('click', () => input.click());
    
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        zone.querySelector('p').textContent = `File Selected: ${input.files[0].name}`;
        zone.style.borderColor = 'var(--primary)';
      }
    });
  });

  // --- Sankalp Sathi AI Chatbot Streaming Implementation ---
  const chatForm = document.getElementById('chatForm');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const typingIndicator = document.getElementById('typingIndicator');
  let chatHistory = [];

  if (chatForm && chatMessages) {
    function createMessageElement(text, sender) {
      const msg = document.createElement('div');
      msg.classList.add('chat-message', sender);
      msg.textContent = text;
      return msg;
    }

    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      chatInput.value = '';
      
      // User message
      chatMessages.appendChild(createMessageElement(userText, 'user'));
      chatHistory.push({ role: 'user', content: userText });
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Show typing status
      typingIndicator.style.display = 'block';
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Prepare AI response message box
      const botMessage = document.createElement('div');
      botMessage.classList.add('chat-message', 'bot');
      botMessage.innerHTML = `<span class="blinking-cursor">|</span>`;
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatHistory })
        });

        typingIndicator.style.display = 'none';

        if (!response.ok) {
          botMessage.textContent = "I'm sorry, I am having trouble connecting to my systems right now. Please call us directly at +91 9453961105.";
          chatMessages.appendChild(botMessage);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          return;
        }

        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let botText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // OpenRouter streams data line by line
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                const token = parsed.choices[0].delta.content || '';
                botText += token;
                botMessage.innerHTML = botText + `<span class="blinking-cursor">|</span>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
              } catch (e) {
                // Parsing complete JSON block may fail on chunk split; ignore safely
              }
            }
          }
        }

        // Clean final output markup cursor
        botMessage.innerHTML = botText;
        chatHistory.push({ role: 'assistant', content: botText });

        // Trigger Lead Capture prompt if user says Admission / Enroll / Fee
        const keywords = ['admission', 'enroll', 'fees', 'fee', 'join', 'class', 'course', 'dakhila', 'bharti'];
        const matchesKeyword = keywords.some(k => userText.toLowerCase().includes(k));
        
        if (matchesKeyword && !document.querySelector('.lead-capture-card')) {
          setTimeout(() => {
            renderLeadCaptureCard();
          }, 1000);
        }

      } catch (err) {
        typingIndicator.style.display = 'none';
        botMessage.textContent = "AI Streaming experienced a network connection error.";
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });

    function renderLeadCaptureCard() {
      const card = document.createElement('div');
      card.classList.add('lead-capture-card');
      card.innerHTML = `
        <h4>⚡ Schedule a Free Counseling Call</h4>
        <form id="chatLeadForm">
          <input type="text" id="chatName" placeholder="Student Name" required class="form-control" style="font-size: 0.9rem; padding: 0.6rem;">
          <input type="text" id="chatClass" placeholder="Class / Target Exam" required class="form-control" style="font-size: 0.9rem; padding: 0.6rem;">
          <input type="tel" id="chatPhone" placeholder="Mobile Number" required class="form-control" style="font-size: 0.9rem; padding: 0.6rem;">
          <input type="text" id="chatCity" placeholder="City / Location" required class="form-control" style="font-size: 0.9rem; padding: 0.6rem;">
          <button type="submit" class="btn-primary" style="padding: 0.6rem; font-size: 0.9rem; width: 100%;">Connect with Counsellor</button>
        </form>
      `;

      chatMessages.appendChild(card);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const chatLeadForm = card.querySelector('#chatLeadForm');
      chatLeadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = chatLeadForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const leadData = {
          firstName: card.querySelector('#chatName').value,
          class: card.querySelector('#chatClass').value,
          interest: 'AI Chat Admission Request',
          phone: card.querySelector('#chatPhone').value,
          city: card.querySelector('#chatCity').value
        };

        try {
          const res = await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
          });
          
          if (res.ok) {
            card.innerHTML = `<h5 style="color: var(--success);">✓ Counseling Request Received!</h5><p style="font-size:0.9rem; color:var(--slate); margin-top:0.5rem;">Our admissions advisor will call you within 24 hours.</p>`;
          } else {
            alert('Lead collection failed.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Connect with Counsellor';
          }
        } catch (err) {
          alert('Network issue.');
          submitBtn.disabled = false;
        }
      });
    }
  }

  // --- Dynamic Gallery Page with Lightbox and Filter Search ---
  const galleryGrid = document.getElementById('galleryGrid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const gallerySearch = document.getElementById('gallerySearch');
  
  let galleryItemsList = [];
  let activeLightboxIndex = 0;

  async function loadGallery() {
    if (!galleryGrid) return;
    
    // Add default fallbacks
    const fallbackImages = [
      { imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', caption: 'Modern Digital Classroom' },
      { imageUrl: 'https://images.unsplash.com/photo-1564981797816-1043d01ad536?auto=format&fit=crop&w=800&q=80', caption: 'Advanced Innovation and Robotics Lab' },
      { imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80', caption: 'Student Discussion and Collaborative Area' },
      { imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', caption: 'Expert Lectures and Conceptual Doubts Solving' },
      { imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', caption: 'Smart Computer and Technology Center' },
      { imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80', caption: 'Primary Student Learning Infrastructure' }
    ];

    try {
      const response = await fetch('/api/public/gallery');
      const data = await response.json();
      
      galleryItemsList = response.ok && data.length > 0 ? data : fallbackImages;
      renderGallery(galleryItemsList);
    } catch (e) {
      galleryItemsList = fallbackImages;
      renderGallery(galleryItemsList);
    }
  }

  function renderGallery(items) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    
    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.classList.add('gallery-item');
      div.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.caption || 'Sankalp Campus'}">
        <div class="gallery-overlay">
          <div class="gallery-caption">${item.caption || 'Sankalp Digital Pathshala'}</div>
        </div>
      `;
      div.addEventListener('click', () => {
        openLightbox(index);
      });
      galleryGrid.appendChild(div);
    });
  }

  function openLightbox(index) {
    if (!lightbox) return;
    activeLightboxIndex = index;
    lightboxImg.src = galleryItemsList[activeLightboxIndex].imageUrl;
    lightboxCaption.textContent = galleryItemsList[activeLightboxIndex].caption || '';
    lightbox.style.display = 'flex';
  }

  function closeLightbox() {
    if (lightbox) lightbox.style.display = 'none';
  }

  function showPrevImage() {
    if (galleryItemsList.length === 0) return;
    activeLightboxIndex = (activeLightboxIndex - 1 + galleryItemsList.length) % galleryItemsList.length;
    openLightbox(activeLightboxIndex);
  }

  function showNextImage() {
    if (galleryItemsList.length === 0) return;
    activeLightboxIndex = (activeLightboxIndex + 1) % galleryItemsList.length;
    openLightbox(activeLightboxIndex);
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    
    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
      if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
      }
    });
  }

  if (gallerySearch) {
    gallerySearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = galleryItemsList.filter(item => 
        (item.caption || '').toLowerCase().includes(term)
      );
      renderGallery(filtered);
    });
  }

  loadGallery();
});
