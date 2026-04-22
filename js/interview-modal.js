(function initInterviewModals() {
  'use strict';

  // 모달 ID 매핑
  const modalMap = {
    'kang-hoyoung': 'modal-kang-hoyoung',
    'kim-deukhwa': 'modal-kim-deukhwa',
    'no-wonwoo': 'modal-no-wonwoo',
    'jo-seongyeon-pro': 'modal-jo-seongyeon-pro'
  };

  // 모달 닫힘 직후 카드 클릭 차단을 위한 타임스탬프
  let modalClosedAt = 0;
  const CLOSE_COOLDOWN = 400; // ms

  // 모바일 스크롤 중 카드 열림 방지
  let touchStartY = 0;
  let isTouchScrolling = false;
  document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
    isTouchScrolling = false;
  }, { passive: true });
  document.addEventListener('touchmove', function(e) {
    if (Math.abs(e.touches[0].clientY - touchStartY) > 8) {
      isTouchScrolling = true;
    }
  }, { passive: true });

  function closeAllModals() {
    Object.values(modalMap).forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('open');
    });
    document.body.style.overflow = '';
    modalClosedAt = Date.now();
    // 모달 닫힐 때 카드 포커스 해제 (모바일 :focus-within 잔류 방지)
    const focusedCard = document.querySelector('.interview-profile-card:focus');
    if (focusedCard) focusedCard.blur();
  }

  function openModal(interviewId) {
    closeAllModals();
    const modalId = modalMap[interviewId];
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        modal.querySelector('.modal-box').scrollTop = 0;
        document.body.style.overflow = 'hidden';
        modalClosedAt = 0; // 방금 열었으므로 쿨다운 불필요
      }
    }
  }

  // 카드 클릭 이벤트
  document.addEventListener('click', function(e) {
    const card = e.target.closest('.interview-profile-card');
    if (card) {
      // 모달 닫힘 직후 쿨다운 중이면 ghost click 무시
      if (Date.now() - modalClosedAt < CLOSE_COOLDOWN) {
        e.stopPropagation();
        return;
      }
      // 모바일에서 스크롤 중 발생한 클릭 무시
      if (isTouchScrolling) return;
      const interviewId = card.getAttribute('data-interview-id');
      if (interviewId) openModal(interviewId);
      return;
    }

    // 오버레이 클릭으로 닫기
    const overlay = e.target.closest('.modal-overlay');
    if (overlay && e.target === overlay) {
      closeAllModals();
    }
  });

  // 닫기 버튼 - touchend에서 즉시 처리 + 합성 click 차단 (모바일 ghost click 방지 핵심)
  document.addEventListener('touchend', function(e) {
    if (e.target.closest('.modal-close')) {
      e.preventDefault();
      closeAllModals();
    }
  }, { passive: false });

  // 데스크탑용 닫기 버튼 (click)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.modal-close')) {
      closeAllModals();
    }
  });

  // 키보드 이벤트
  document.addEventListener('keydown', function(e) {
    // 카드 포커스 상태에서 Enter/Space로 모달 열기
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList && activeElement.classList.contains('interview-profile-card')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const interviewId = activeElement.getAttribute('data-interview-id');
        if (interviewId) openModal(interviewId);
      }
    }

    // ESC로 모달 닫기
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

})();
