(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tags = (list) => `<ul class="tags">${list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const initials = (t) => t.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#year").textContent = new Date().getFullYear();

  // theme toggle
  const root = document.documentElement;
  $("#theme").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  // mobile menu
  const burger = $("#burger"), sheet = $("#sheet");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.classList.toggle("open", open);
    sheet.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("#sheet a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // project cards
  const card = (p) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card reveal";
    el.dataset.roles = p.roles.join(" ");
    const play = (p.video || p.drive || p.drives) ? `<span class="play"><i class="ph ph-play"></i></span>` : "";
    const thumb = p.image
      ? `<img class="photo" loading="lazy" src="${esc(p.image)}" alt="${esc(p.title)}">${play}`
      : p.video
      ? `<img loading="lazy" src="https://i.ytimg.com/vi/${p.video}/hqdefault.jpg" alt="Video still from ${esc(p.title)}">${play}`
      : `<span class="glyph">${initials(p.title)}</span>${play}`;
    el.innerHTML = `
      <div class="thumb">${thumb}</div>
      <div class="card-body">
        <div class="meta mono"><span>${esc(p.role)}</span><span>${esc(p.year)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        ${tags(p.tech.slice(0, 4))}
      </div>`;
    const img = el.querySelector("img");
    if (img) img.addEventListener("error", () => img.replaceWith(Object.assign(document.createElement("span"), { className: "glyph", textContent: initials(p.title) })));
    el.addEventListener("click", (e) => openProject(p, el));
    return el;
  };
  SERIOUS_GAMES.forEach((p) => $("#serious-grid").appendChild(card(p)));
  const gamesGrid = $("#games-grid");
  const SHOW = 6;
  GAMES.forEach((p, i) => { const c = card(p); if (i >= SHOW) c.hidden = true; gamesGrid.appendChild(c); });
  if (GAMES.length > SHOW) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "btn ghost more";
    more.innerHTML = `<i class="ph ph-plus"></i>Show all ${GAMES.length} games`;
    more.addEventListener("click", () => {
      $$(".card", gamesGrid).forEach((c) => { c.hidden = false; c.classList.add("in"); });
      more.remove();
    });
    gamesGrid.after(more);
  }

  // modal
  const modal = $("#modal");
  function openProject(p, from) {
    const drives = p.drives || (p.drive ? [p.drive] : []);
    const driveSrc = (id) => `https://drive.google.com/file/d/${id}/preview`;
    const src = p.video ? `https://www.youtube-nocookie.com/embed/${p.video}?autoplay=1&rel=0`
      : drives.length ? driveSrc(drives[0]) : "";
    const switcher = drives.length > 1
      ? `<div class="vid-switch" role="tablist">${drives.map((id, i) => `<button class="chip${i ? "" : " active"}" role="tab" aria-selected="${!i}" data-src="${driveSrc(id)}">Video ${i + 1}</button>`).join("")}</div>` : "";
    const media = src
      ? `<div class="embed"><iframe src="${src}" title="${esc(p.title)} video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      : p.image ? `<div class="embed"><img src="${esc(p.image)}" alt="${esc(p.title)}" style="width:100%;height:100%;object-fit:cover"></div>` : "";
    // grow the window out of the card that was tapped
    if (from) {
      const r = from.getBoundingClientRect();
      const w = Math.min(860, innerWidth - 32), h = Math.min(innerHeight - 48, 640);
      modal.style.setProperty("--ox", `${r.left + r.width / 2 - (innerWidth - w) / 2}px`);
      modal.style.setProperty("--oy", `${r.top + r.height / 2 - (innerHeight - h) / 2}px`);
    }
    $("#modal-body").innerHTML = `${media}${switcher}
      <div class="modal-text">
        <p class="mono" style="font-size:.875rem">${esc(p.year ? p.year + " · " : "")}${esc(p.role)}</p>
        <h3 id="modal-title">${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        ${tags(p.tech)}
        ${p.link ? `<p><a class="text-link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || "Open link")} <i class="ph ph-arrow-up-right"></i></a></p>` : ""}
      </div>`;
    $$(".vid-switch .chip", modal).forEach((b) => b.addEventListener("click", () => {
      $$(".vid-switch .chip", modal).forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); });
      $(".embed iframe", modal).src = b.dataset.src;
    }));
    modal.showModal();
  }
  const closeModal = () => { modal.close(); $("#modal-body").innerHTML = ""; };
  $(".close", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener("close", () => { $("#modal-body").innerHTML = ""; });

  // publications
  $("#pubs").innerHTML = PUBLICATIONS.map((p) => `
    <li class="reveal" data-roles="${p.roles.join(" ")}"><span class="y mono">${p.year}</span>
      <div>
        <div class="t">${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)} <i class="ph ph-arrow-up-right"></i></a>` : esc(p.title)}</div>
        ${p.authors ? `<div class="by">${esc(p.authors).replace(/(D\. S\. Lopez|D\. Lopez)/, "<b>$1</b>")}</div>` : ""}
        <div class="venue">${esc(p.venue)}</div>
      </div></li>`).join("");

  // experience
  $("#timeline").innerHTML = EXPERIENCE.map((e) => `
    <li class="reveal" data-roles="${e.roles.join(" ")}"><span class="when mono">${esc(e.when)}</span>
      <div><b>${esc(e.role)}</b> · <span class="org">${esc(e.org)}</span><p>${esc(e.desc)}</p>${e.image ? `<img class="tl-photo" loading="lazy" src="${esc(e.image)}" alt="${esc(e.role)} at ${esc(e.org)}">` : ""}</div></li>`).join("");

  // skills
  const icons = { game: "ph-game-controller", research: "ph-flask", ai: "ph-brain", all: "ph-wrench" };
  $("#skill-groups").innerHTML = SKILLS.map((s) => `
    <div class="skill reveal" data-roles="${s.role === "all" ? "game research ai" : s.role}">
      <h3><i class="ph ${icons[s.role]}"></i>${esc(s.group)}</h3>${tags(s.items)}</div>`).join("");

  // photo gallery (native scroll snap carries momentum; buttons step one photo)
  const gal = $("#gallery");
  gal.innerHTML = GALLERY.map((g) => `
    <figure class="shot${/van-gogh/.test(g.src) ? " wide" : ""}"><div class="ph-frame"><img loading="lazy" src="${esc(g.src)}" alt="${esc(g.alt)}"></div>
    <figcaption>${esc(g.caption)}</figcaption></figure>`).join("");
  const step = (dir) => {
    const shot = $(".shot", gal);
    gal.scrollBy({ left: dir * (shot.offsetWidth + 16), behavior: reduced ? "auto" : "smooth" });
  };
  $("#g-prev").addEventListener("click", () => step(-1));
  $("#g-next").addEventListener("click", () => step(1));

  // role lens
  const sub = $("#role-sub");
  $$(".chip[data-role]").forEach((chip) => chip.addEventListener("click", () => {
    const role = chip.dataset.role;
    $$(".chip[data-role]").forEach((c) => { const on = c === chip; c.classList.toggle("active", on); c.setAttribute("aria-checked", on); });
    $$("[data-roles]").forEach((el) => el.classList.toggle("dim", role !== "all" && !el.dataset.roles.split(" ").includes(role)));
    sub.classList.add("swap");
    setTimeout(() => { sub.textContent = ROLE_COPY[role]; sub.classList.remove("swap"); }, reduced ? 0 : 300);
  }));

  // tagline: split into words that light up one at a time as they cross the trigger line
  const tag = $("#tagline");
  tag.innerHTML = tag.textContent.trim().split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  const wo = new IntersectionObserver((entries) => entries.forEach((en) => {
    en.target.classList.toggle("on", en.boundingClientRect.top < innerHeight * 0.6);
  }), { rootMargin: "0px 0px -40% 0px", threshold: 0 });
  $$(".w", tag).forEach((w, i) => { w.style.transitionDelay = `${(i % 6) * 40}ms`; wo.observe(w); });

  // counters
  const count = (el) => {
    if (reduced) return;
    const end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // scroll reveal
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    $$("[data-count]", en.target).forEach(count);
    io.unobserve(en.target);
  }), { threshold: 0.08 });
  $$(".reveal").forEach((el) => io.observe(el));

  // current section in nav
  const links = $$(".links a");
  const so = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("current", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => so.observe(s));

})();
