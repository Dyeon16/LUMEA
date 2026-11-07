(function () {
  'use strict';

  var root = document.documentElement;

  // Motion is opt-in: with reduced motion the page stays a plain, static document.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* The product video has no controls, so it plays whenever it is on screen.
     This stays independent of GSAP so it still plays if the CDN is unreachable. */
  var video = document.querySelector('[data-autoplay-in-view]');
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      video.play().catch(function () {});
    } else {
      video.pause();
    }
  }).observe(video);

  // If the CDN is unreachable, reveal the hero copy that the CSS hid and stop here.
  if (!window.gsap || !window.ScrollTrigger || !window.ScrollSmoother) {
    root.classList.remove('js-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  var EASE = 'power2.out';

  var smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 0.6,
    ignoreMobileResize: true
  });

  /* Hero: gentle settle on load, then the image lags behind the scroll. */
  var hero = document.querySelector('.lm-hero');
  var heroImage = hero.querySelector('img');
  var heroCopy = hero.querySelector('.lm-hero-pad');

  gsap.fromTo(heroImage, { scale: 1.04 }, { scale: 1, duration: 1.8, ease: 'power2.out' });
  gsap.fromTo(
    heroCopy.children,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.12, delay: 0.25 }
  );

  // Starts only once the hero's top edge has left the viewport, so the gap this
  // opens above the image is never visible and the logo is never cropped at rest.
  var heroScroll = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(heroImage, { yPercent: 12, ease: 'none', scrollTrigger: heroScroll });
  gsap.to(heroCopy, { y: -48, opacity: 0.7, ease: 'none', scrollTrigger: heroScroll });

  /* Scroll reveals. Opacity rather than visibility, so links stay keyboard-focusable. */
  var revealItems = gsap.utils.toArray('[data-reveal], [data-reveal-group] > *');
  gsap.set(revealItems, { opacity: 0, y: 24 });
  ScrollTrigger.batch(revealItems, {
    start: 'top 90%',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: EASE,
        stagger: 0.08,
        clearProps: 'transform,opacity'
      });
    }
  });

  /* Line icons draw themselves in as they appear. */
  gsap.utils.toArray('[data-draw]').forEach(function (svg) {
    var shapes = svg.querySelectorAll('rect, circle, path, line');
    shapes.forEach(function (shape) {
      shape.setAttribute('pathLength', '1');
    });
    gsap.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(shapes, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power1.inOut',
      delay: 0.15,
      clearProps: 'strokeDasharray,strokeDashoffset',
      scrollTrigger: { trigger: svg, start: 'top 90%', once: true }
    });
  });

  /* Image parallax inside a clipped frame. The overscan always exceeds the travel,
     so the frame never shows an empty edge. */
  gsap.utils.toArray('[data-parallax]').forEach(function (image) {
    var amount = parseFloat(image.getAttribute('data-parallax'));
    var travel = (amount / 2) * 100 * 0.9;
    gsap.fromTo(
      image,
      { scale: 1 + amount, yPercent: -travel },
      {
        yPercent: travel,
        ease: 'none',
        scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });

  /* Promo banner settles to its exact original framing as it reaches mid-screen. */
  var banner = document.querySelector('[data-settle]');
  gsap.fromTo(
    banner,
    { scale: 1.06, yPercent: 2 },
    {
      scale: 1,
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: banner.parentElement, start: 'top bottom', end: 'center center', scrub: true }
    }
  );

  /* The product image floats against its copy only where they sit side by side. */
  gsap.matchMedia().add('(min-width: 900px)', function () {
    gsap.fromTo(
      '[data-float]',
      { y: 36 },
      {
        y: -36,
        ease: 'none',
        scrollTrigger: { trigger: '#product', start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });

  /* Buttons lift slightly on hover. */
  if (window.matchMedia('(hover: hover)').matches) {
    gsap.utils.toArray('.lm-cta').forEach(function (cta) {
      cta.addEventListener('mouseenter', function () {
        gsap.to(cta, { y: -2, duration: 0.25, ease: EASE, overwrite: 'auto' });
      });
      cta.addEventListener('mouseleave', function () {
        gsap.to(cta, { y: 0, duration: 0.25, ease: EASE, overwrite: 'auto' });
      });
    });
  }

  /* The content layer is transformed, so in-page links must go through ScrollSmoother.
     Touch-only devices scroll natively and keep the browser's own anchor behaviour. */
  if (ScrollTrigger.isTouch !== 1) {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (hash.length < 2 || !document.querySelector(hash)) return;
      event.preventDefault();
      smoother.scrollTo(hash, true, 'top top');
      history.pushState(null, '', hash);
    });

    window.addEventListener('load', function () {
      if (location.hash && document.querySelector(location.hash)) {
        smoother.scrollTo(location.hash, false, 'top top');
      }
    });
  }

  // Web fonts change text height after first layout.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
})();
