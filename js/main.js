/* ===================================================
   🐥 삐약이 포트폴리오 메인 스크립트
   규칙 준수: var 금지, 인라인 속성 금지, addEventListener 사용
   이벤트: click, submit, scroll, input 모두 구현
   =================================================== */

// 1. DOM 요소 선택 (querySelector, querySelectorAll)
const themeToggleBtn = document.querySelector('#theme-toggle');
const hamburgerBtn = document.querySelector('#hamburger-btn');
const navMenu = document.querySelector('#nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('#header');
const scrollTopBtn = document.querySelector('#scroll-top-btn');

// Projects 관련 DOM
const projectsContainer = document.querySelector('#projects-container');

// Contact 폼 관련 DOM
const contactForm = document.querySelector('#contact-form');
const nameInput = document.querySelector('#user-name');
const emailInput = document.querySelector('#user-email');
const messageInput = document.querySelector('#user-message');
const nameError = document.querySelector('#name-error');
const emailError = document.querySelector('#email-error');
const messageError = document.querySelector('#message-error');
const formSuccess = document.querySelector('#form-success');

/* ---------------------------------------------------
   [요구사항 5-e, 9] 다크 모드 토글 (localStorage 상태 유지)
--------------------------------------------------- */
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

themeToggleBtn.addEventListener('click', () => {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  if (isDarkMode) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
});

/* ---------------------------------------------------
   [요구사항 5-a] 모바일 햄버거 메뉴 토글 (classList.toggle)
--------------------------------------------------- */
hamburgerBtn.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// forEach 배열 메서드 활용: 링크 클릭 시 메뉴 닫기
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
  });
});

/* ---------------------------------------------------
   [요구사항 5-c, 5-d] 스크롤 이벤트 (헤더 변화 & 탑 버튼)
--------------------------------------------------- */
window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;

  // 60px 이상 스크롤 시 헤더 그림자/테두리 활성화
  if (currentScrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  // 300px 이상 스크롤 시 스크롤 탑 버튼 표시
  if (currentScrollY > 300) {
    scrollTopBtn.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

/* ---------------------------------------------------
   [요구사항 5-f] Intersection Observer 스크롤 등장 애니메이션 (임계값 0.2)
--------------------------------------------------- */
const observerOptions = {
  root: null,
  threshold: 0.2
};

const observerCallback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show-element');
      observer.unobserve(entry.target); // 1회 등장 후 관찰 해제
    }
  });
};

const sectionObserver = new IntersectionObserver(observerCallback, observerOptions);
const targetSections = document.querySelectorAll('.animate-target');
targetSections.forEach((section) => sectionObserver.observe(section));

/* ---------------------------------------------------
   [요구사항 7, 8, 9] GitHub API 비동기 연동 & 4가지 상태 UI
--------------------------------------------------- */
// ⚠️ 본인의 실제 GitHub 아이디로 변경해 주세요!
const GITHUB_USERNAME = 'seohihi';

// 상태별 렌더링 함수들
const renderLoading = () => {
  projectsContainer.innerHTML = `
    <div class="loading-state">
      <i class="fa-solid fa-spinner fa-spin loading-spinner"></i>
      <p>병아리가 저장소 모이를 물어오는 중입니다...</p>
    </div>
  `;
};

const renderError = (errorMessage) => {
  projectsContainer.innerHTML = `
    <div class="error-state">
      <i class="fa-solid fa-circle-exclamation error-icon"></i>
      <p>${errorMessage}</p>
      <button id="retry-btn" class="retry-btn">다시 시도 🐥</button>
    </div>
  `;
  document.querySelector('#retry-btn').addEventListener('click', fetchProjects);
};

const renderEmpty = () => {
  projectsContainer.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-egg empty-icon"></i>
      <p>표시할 프로젝트가 없습니다. 둥지가 비어있어요!</p>
    </div>
  `;
};

const renderSuccess = (repos) => {
  // map 메서드 & 템플릿 리터럴로 카드 동적 생성
  const cardsTemplate = repos.map((repo) => {
    // 구조분해 할당 (Destructuring)
    const { name, description, html_url, stargazers_count, language } = repo;

    return `
      <article class="project-card">
        <div>
          <h3 class="project-title">${name}</h3>
          <p class="project-desc">${description || '설명이 등록되어 있지 않은 프로젝트입니다.'}</p>
        </div>
        <div class="project-meta">
          <span><i class="fa-solid fa-code"></i> ${language || '기타'}</span>
          <span><i class="fa-solid fa-star"></i> ${stargazers_count}</span>
          <a href="${html_url}" target="_blank" rel="noopener noreferrer" class="project-link">
            구경가기 &rarr;
          </a>
        </div>
      </article>
    `;
  }).join('');

  projectsContainer.innerHTML = cardsTemplate;
};

// async/await 비동기 요청 함수
async function fetchProjects() {
  renderLoading(); // 1. 로딩 상태

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`);

    // 403 Rate Limit 및 에러 상태 대응
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        throw new Error('프로젝트를 불러올 수 없습니다.');
      }
    }

    const data = await response.json();

    if (data.length === 0) {
      renderEmpty(); // 2. 빈 상태
      return;
    }

    renderSuccess(data); // 3. 성공 상태
  } catch (error) {
    renderError(error.message || '네트워크 오류가 발생했습니다.'); // 4. 에러 상태
  }
}

fetchProjects();

/* ---------------------------------------------------
   [요구사항 4, 6] Contact 폼 검증 (submit & input 실시간 이벤트)
--------------------------------------------------- */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// input 이벤트: 입력하는 순간 실시간으로 에러 문구 지우기
nameInput.addEventListener('input', () => {
  if (nameInput.value.trim() !== '') nameError.textContent = '';
});

emailInput.addEventListener('input', () => {
  if (emailInput.value.trim() !== '' && validateEmail(emailInput.value.trim())) {
    emailError.textContent = '';
  }
});

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim() !== '') messageError.textContent = '';
});

// submit 이벤트
contactForm.addEventListener('submit', (event) => {
  event.preventDefault(); // 기본 새로고침 방지

  let hasError = false;

  if (nameInput.value.trim() === '') {
    nameError.textContent = '이름을 입력해 주세요.';
    hasError = true;
  }

  if (emailInput.value.trim() === '') {
    emailError.textContent = '이메일을 입력해 주세요.';
    hasError = true;
  } else if (!validateEmail(emailInput.value.trim())) {
    emailError.textContent = '올바른 이메일 형식을 입력해 주세요.';
    hasError = true;
  }

  if (messageInput.value.trim() === '') {
    messageError.textContent = '메시지 내용을 입력해 주세요.';
    hasError = true;
  }

  if (hasError) return;

  // 통과 시 성공 상태 피드백
  formSuccess.classList.remove('hidden');
  contactForm.reset();

  setTimeout(() => {
    formSuccess.classList.add('hidden');
  }, 4000);
});