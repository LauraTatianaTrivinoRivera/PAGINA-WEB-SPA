/**
 * MANICURE A DOMICILIO BOGOTÁ - JavaScript
 * Navegación, animaciones scroll, menú móvil
 */

(function () {
  'use strict';

  // ---------- Referencias DOM ----------
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav__link');
  const revealElements = document.querySelectorAll('.reveal');
  const whatsappFloat = document.getElementById('whatsappFloat');

  // ---------- Header con sombra al hacer scroll ----------
  function handleHeaderScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ---------- Menú móvil (hamburguesa) ----------
  function toggleMobileMenu() {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
  }

  navToggle.addEventListener('click', toggleMobileMenu);

  // Cerrar menú al hacer clic en un enlace
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navToggle.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ---------- Enlace activo según sección visible ----------
  const sections = document.querySelectorAll('section[id]');

  function setActiveNavLink() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveNavLink, { passive: true });

  // ---------- Animaciones al hacer scroll (Intersection Observer) ----------
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12
    }
  );

  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });

  // ---------- Galería: hover suave sin recortar la imagen ----------
  const galleryItems = document.querySelectorAll('.gallery__item');

  galleryItems.forEach(function (item) {
    item.addEventListener('mouseleave', function () {
      const img = item.querySelector('img');
      if (img) {
        img.style.transform = '';
      }
    });
  });

  // ---------- Mostrar botón WhatsApp tras scroll inicial ----------
  if (whatsappFloat) {
    whatsappFloat.style.opacity = '0';
    whatsappFloat.style.transform = 'scale(0.8)';

    setTimeout(function () {
      whatsappFloat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      whatsappFloat.style.opacity = '1';
      whatsappFloat.style.transform = 'scale(1)';
    }, 1500);
  }

  // ---------- Cerrar menú al redimensionar ventana ----------
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1100) {
      navToggle.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

})();
