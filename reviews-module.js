/**
 * Módulo de reseñas en la nube (Firebase Firestore + Storage)
 * Las reseñas son visibles desde cualquier celular o computador.
 */
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '573143890546';
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  const reviewForm = document.getElementById('reviewForm');
  const reviewName = document.getElementById('reviewName');
  const reviewLocation = document.getElementById('reviewLocation');
  const reviewText = document.getElementById('reviewText');
  const reviewImage = document.getElementById('reviewImage');
  const reviewImagePreview = document.getElementById('reviewImagePreview');
  const reviewImagePreviewImg = document.getElementById('reviewImagePreviewImg');
  const reviewImageRemove = document.getElementById('reviewImageRemove');
  const reviewCounter = document.getElementById('reviewCounter');
  const reviewMessage = document.getElementById('reviewMessage');
  const reviewSubmitBtn = document.getElementById('reviewSubmitBtn');
  const reviewsGrid = document.getElementById('userReviewsGrid');
  const reviewsStatus = document.getElementById('reviewsStatus');
  const ratingStarsContainer = document.getElementById('ratingStars');
  const ratingLabel = document.getElementById('ratingLabel');
  const sendWhatsappBtn = document.getElementById('sendWhatsappReview');

  let currentRating = 0;
  let db = null;
  let storage = null;
  let firebaseReady = false;

  const RATING_LABELS = {
    0: 'Selecciona',
    1: '¡Auch!',
    2: 'Regular',
    3: 'Buena',
    4: 'Muy buena',
    5: '¡Excelente!'
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isFirebaseConfigured() {
    const cfg = window.MANICURE_FIREBASE_CONFIG;
    if (!cfg) return false;
    return (
      cfg.apiKey &&
      cfg.apiKey !== 'TU_API_KEY' &&
      cfg.projectId &&
      cfg.projectId !== 'tu-proyecto-id'
    );
  }

  function initFirebase() {
    if (!isFirebaseConfigured() || typeof firebase === 'undefined') {
      return false;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.MANICURE_FIREBASE_CONFIG);
      }
      db = firebase.firestore();
      storage = firebase.storage();
      firebaseReady = true;
      return true;
    } catch (err) {
      console.error('Error al iniciar Firebase:', err);
      return false;
    }
  }

  function setReviewsStatus(html, className) {
    if (!reviewsStatus) return;
    reviewsStatus.hidden = false;
    reviewsStatus.innerHTML = html;
    reviewsStatus.className = 'reviews__status' + (className ? ' ' + className : '');
  }

  function renderReviewCard(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const location = review.location
      ? '<span class="testimonial-card__location">' + escapeHtml(review.location) + ', Bogotá</span>'
      : '';
    const imageBlock = review.imageUrl
      ? '<figure class="testimonial-card__photo"><img src="' + escapeHtml(review.imageUrl) + '" alt="Foto del servicio de ' + escapeHtml(review.name) + '" loading="lazy"></figure>'
      : '';

    return (
      '<blockquote class="testimonial-card testimonial-card--user">' +
        imageBlock +
        '<div class="testimonial-card__stars">' + stars + '</div>' +
        '<p class="testimonial-card__text">"' + escapeHtml(review.text) + '"</p>' +
        '<footer class="testimonial-card__author">' +
          '<span class="testimonial-card__name">' + escapeHtml(review.name) + '</span>' +
          location +
        '</footer>' +
      '</blockquote>'
    );
  }

  function listenReviews() {
    if (!firebaseReady || !reviewsGrid) return;

    setReviewsStatus('<span class="reviews__loading">Cargando reseñas...</span>', 'reviews__status--loading');

    db.collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        function (snapshot) {
          const reviews = [];
          snapshot.forEach(function (doc) {
            reviews.push(doc.data());
          });

          if (reviews.length === 0) {
            reviewsGrid.innerHTML = '';
            setReviewsStatus(
              '<p>Aún no hay reseñas publicadas. ¡Sé la primera en compartir tu experiencia!</p>',
              'reviews__status--empty'
            );
            return;
          }

          reviewsGrid.innerHTML = reviews.map(renderReviewCard).join('');
          if (reviewsStatus) reviewsStatus.hidden = true;
        },
        function (error) {
          console.error('Error al cargar reseñas:', error);
          setReviewsStatus(
            '<p>No se pudieron cargar las reseñas. Verifica la configuración de Firebase.</p>',
            'reviews__status--error'
          );
        }
      );
  }

  function updateStarsVisual(value, isHover) {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('.rating-star');
    stars.forEach(function (star) {
      const v = parseInt(star.getAttribute('data-value'), 10);
      star.classList.toggle(isHover ? 'hover' : 'active', v <= value);
      if (!isHover) star.classList.remove('hover');
    });
    if (ratingLabel) {
      ratingLabel.textContent = RATING_LABELS[value] || RATING_LABELS[0];
    }
  }

  function initRatingStars() {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('.rating-star');

    stars.forEach(function (star) {
      star.addEventListener('mouseenter', function () {
        updateStarsVisual(parseInt(star.getAttribute('data-value'), 10), true);
      });
      star.addEventListener('click', function () {
        currentRating = parseInt(star.getAttribute('data-value'), 10);
        updateStarsVisual(currentRating, false);
      });
    });

    ratingStarsContainer.addEventListener('mouseleave', function () {
      updateStarsVisual(currentRating, false);
    });
  }

  function showMessage(text, type) {
    if (!reviewMessage) return;
    reviewMessage.textContent = text;
    reviewMessage.className = 'review-form__message ' + (type || '');
    if (type === 'success') {
      setTimeout(function () {
        reviewMessage.textContent = '';
        reviewMessage.className = 'review-form__message';
      }, 6000);
    }
  }

  function setSubmitting(isSubmitting) {
    if (!reviewSubmitBtn) return;
    reviewSubmitBtn.disabled = isSubmitting;
    reviewSubmitBtn.textContent = isSubmitting ? 'Publicando...' : 'Publicar reseña';
    if (sendWhatsappBtn) sendWhatsappBtn.disabled = isSubmitting;
  }

  function validateImageFile(file) {
    if (!file) return { ok: true };
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { ok: false, msg: 'Solo se permiten imágenes JPG o PNG.' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { ok: false, msg: 'La imagen no puede superar 5 MB.' };
    }
    return { ok: true };
  }

  function clearImagePreview() {
    if (reviewImage) reviewImage.value = '';
    if (reviewImagePreview) reviewImagePreview.hidden = true;
    if (reviewImagePreviewImg) reviewImagePreviewImg.src = '';
  }

  function getFormData() {
    const name = reviewName ? reviewName.value.trim() : '';
    const location = reviewLocation ? reviewLocation.value.trim() : '';
    const text = reviewText ? reviewText.value.trim() : '';
    const imageFile = reviewImage && reviewImage.files[0] ? reviewImage.files[0] : null;

    if (reviewName) reviewName.classList.toggle('error', !name);
    if (reviewText) reviewText.classList.toggle('error', !text);

    if (!name || !text || currentRating === 0) {
      let msg = 'Por favor completa los campos marcados con *';
      if (currentRating === 0) msg = 'Por favor selecciona una calificación con las estrellas';
      else if (!name) msg = 'Por favor ingresa tu nombre';
      else if (!text) msg = 'Por favor escribe tu reseña';
      showMessage(msg, 'error');
      return null;
    }

    const imageCheck = validateImageFile(imageFile);
    if (!imageCheck.ok) {
      showMessage(imageCheck.msg, 'error');
      return null;
    }

    return { name: name, location: location, text: text, rating: currentRating, imageFile: imageFile };
  }

  function resetForm() {
    if (reviewForm) reviewForm.reset();
    currentRating = 0;
    updateStarsVisual(0, false);
    clearImagePreview();
    if (reviewCounter) reviewCounter.textContent = '0 / 400';
  }

  function uploadReviewImage(file) {
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = Date.now() + '_' + Math.random().toString(36).slice(2, 9) + '.' + ext;
    const ref = storage.ref('review-images/' + fileName);
    return ref.put(file).then(function () {
      return ref.getDownloadURL();
    });
  }

  function publishReview(data) {
    if (!firebaseReady) {
      showMessage(
        'Las reseñas en la nube aún no están configuradas. Revisa el archivo firebase-config.js.',
        'error'
      );
      return Promise.reject(new Error('Firebase no configurado'));
    }

    setSubmitting(true);

    const savePromise = data.imageFile
      ? uploadReviewImage(data.imageFile).then(function (imageUrl) {
          return db.collection('reviews').add({
            name: data.name,
            location: data.location || '',
            text: data.text,
            rating: data.rating,
            imageUrl: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
      : db.collection('reviews').add({
          name: data.name,
          location: data.location || '',
          text: data.text,
          rating: data.rating,
          imageUrl: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

    return savePromise
      .then(function () {
        showMessage('¡Gracias! Tu reseña se publicó y ya la pueden ver todas.', 'success');
        resetForm();
        setTimeout(function () {
          const firstCard = reviewsGrid && reviewsGrid.querySelector('.testimonial-card--user');
          if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      })
      .catch(function (err) {
        console.error('Error al publicar reseña:', err);
        showMessage('No se pudo publicar la reseña. Intenta de nuevo en unos minutos.', 'error');
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function buildWhatsappMessage(data) {
    const stars = '⭐'.repeat(data.rating);
    let msg = '*Nueva reseña - Manicure Bogotá*%0A%0A';
    msg += '*Nombre:* ' + encodeURIComponent(data.name) + '%0A';
    if (data.location) msg += '*Zona:* ' + encodeURIComponent(data.location) + ', Bogotá%0A';
    msg += '*Calificación:* ' + stars + ' (' + data.rating + '/5)%0A';
    msg += '*Reseña:* ' + encodeURIComponent(data.text);
    if (data.imageFile) msg += '%0A%0A_(La cliente adjuntó una foto en la web)_';
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
  }

  if (reviewText && reviewCounter) {
    reviewText.addEventListener('input', function () {
      reviewCounter.textContent = reviewText.value.length + ' / 400';
    });
  }

  [reviewName, reviewText].forEach(function (input) {
    if (input) {
      input.addEventListener('input', function () {
        input.classList.remove('error');
      });
    }
  });

  if (reviewImage) {
    reviewImage.addEventListener('change', function () {
      const file = reviewImage.files[0];
      if (!file) {
        clearImagePreview();
        return;
      }
      const check = validateImageFile(file);
      if (!check.ok) {
        showMessage(check.msg, 'error');
        clearImagePreview();
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        if (reviewImagePreviewImg) reviewImagePreviewImg.src = e.target.result;
        if (reviewImagePreview) reviewImagePreview.hidden = false;
      };
      reader.readAsDataURL(file);
    });
  }

  if (reviewImageRemove) {
    reviewImageRemove.addEventListener('click', clearImagePreview);
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = getFormData();
      if (!data) return;
      publishReview(data);
    });
  }

  if (sendWhatsappBtn) {
    sendWhatsappBtn.addEventListener('click', function () {
      const data = getFormData();
      if (!data) return;
      window.open(buildWhatsappMessage(data), '_blank', 'noopener');
      showMessage('Se abrió WhatsApp con tu reseña lista para enviar.', 'success');
    });
  }

  initRatingStars();

  if (initFirebase()) {
    listenReviews();
  } else {
    setReviewsStatus(
      '<p><strong>Configura Firebase</strong> en el archivo <code>firebase-config.js</code> para activar las reseñas en la nube. Mientras tanto puedes enviar tu opinión por WhatsApp.</p>',
      'reviews__status--config'
    );
  }
})();
