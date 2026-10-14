document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav-links");
  if (menuBtn && nav) menuBtn.addEventListener("click", () => nav.classList.toggle("show"));

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  const getUsers = () => JSON.parse(localStorage.getItem("dobuUsers") || "[]");
  const saveUsers = users => localStorage.setItem("dobuUsers", JSON.stringify(users));
  const getCurrentUser = () => JSON.parse(localStorage.getItem("dobuCurrentUser") || "null");
  const showAlert = (box, type, message) => {
    if (!box) return;
    box.className = `alert ${type}`;
    box.textContent = message;
    box.style.display = "block";
  };

  // Registration: save account and redirect to login.
  const registerForm = document.querySelector("#registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.querySelector("#name").value.trim();
      const email = document.querySelector("#email").value.trim().toLowerCase();
      const phone = document.querySelector("#phone").value.trim();
      const membership = document.querySelector("#membership").value;
      const pass = document.querySelector("#password").value;
      const confirm = document.querySelector("#confirmPassword").value;
      const alertBox = document.querySelector("#formAlert");

      if (pass.length < 8) return showAlert(alertBox, "error", "Password must contain at least 8 characters.");
      if (pass !== confirm) return showAlert(alertBox, "error", "Passwords do not match.");
      if (!name || !email || !phone || !membership) return showAlert(alertBox, "error", "Please complete all required fields.");

      const users = getUsers();
      if (users.some(u => u.email === email)) return showAlert(alertBox, "error", "An account with this email already exists. Please login.");

      users.push({ name, email, phone, membership, password: pass, bookings: [] });
      saveUsers(users);
      showAlert(alertBox, "success", "Registration successful. Redirecting to login...");
      setTimeout(() => location.href = "login.html", 900);
    });
  }

  // Login: validate registered account and create current session.
  const loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const email = document.querySelector("#loginEmail").value.trim().toLowerCase();
      const password = document.querySelector("#loginPassword").value;
      const alertBox = document.querySelector("#loginAlert");
      const user = getUsers().find(u => u.email === email && u.password === password);

      if (!user) return showAlert(alertBox, "error", "Invalid email or password. Please register first or check your details.");
      localStorage.setItem("dobuCurrentUser", JSON.stringify({ email: user.email }));
      showAlert(alertBox, "success", `Welcome ${user.name}! Redirecting to your dashboard...`);
      setTimeout(() => location.href = "dashboard.html", 700);
    });
  }

  // Dashboard access and member information.
  const dashboard = document.querySelector("#bookingForm");
  if (dashboard) {
    const current = getCurrentUser();
    const users = getUsers();
    const user = current ? users.find(u => u.email === current.email) : null;
    if (!user) {
      location.href = "login.html";
      return;
    }

    document.querySelector("#dashboardName").textContent = user.name;
    document.querySelector("#welcomeName").textContent = user.name;
    document.querySelector("#dashboardEmail").textContent = user.email;
    document.querySelector("#dashboardMembership").textContent = user.membership;

    const dateInput = document.querySelector("#bookingDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    const renderHistory = () => {
      const history = document.querySelector("#bookingHistory");
      const count = document.querySelector("#bookingCount");
      const bookings = user.bookings || [];
      count.textContent = bookings.length;
      if (!bookings.length) {
        history.innerHTML = '<div class="empty-history">No bookings yet. Use the booking form above to reserve a class.</div>';
        return;
      }
      const rows = bookings.slice().reverse().map((b, index) => `
        <tr>
          <td>${escapeHtml(b.className)}</td><td>${escapeHtml(formatDate(b.date))}</td><td>${escapeHtml(b.time)}</td>
          <td><span class="status-badge">Confirmed</span></td>
          <td><button class="danger-btn cancel-booking" data-index="${bookings.length - 1 - index}">Cancel</button></td>
        </tr>`).join("");
      history.innerHTML = `<div class="history-table"><table><thead><tr><th>Class</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      history.querySelectorAll(".cancel-booking").forEach(btn => btn.addEventListener("click", () => {
        user.bookings.splice(Number(btn.dataset.index), 1);
        updateUser(user);
        renderHistory();
      }));
    };

    dashboard.addEventListener("submit", e => {
      e.preventDefault();
      const alertBox = document.querySelector("#bookingAlert");
      const className = document.querySelector("#bookingClass").value;
      const date = document.querySelector("#bookingDate").value;
      const time = document.querySelector("#bookingTime").value;
      const notes = document.querySelector("#bookingNotes").value.trim();
      if (!className || !date || !time) return showAlert(alertBox, "error", "Please select a class, date and time.");
      if (user.bookings.some(b => b.date === date && b.time === time)) return showAlert(alertBox, "error", "You already have a booking at this date and time.");
      user.bookings.push({ className, date, time, notes, createdAt: new Date().toISOString() });
      updateUser(user);
      dashboard.reset();
      dateInput.min = new Date().toISOString().split("T")[0];
      showAlert(alertBox, "success", "Your class has been booked successfully and added to your booking history.");
      renderHistory();
    });

    renderHistory();
  }

  // Logout
  const logoutLink = document.querySelector("#logoutLink");
  if (logoutLink) logoutLink.addEventListener("click", e => {
    e.preventDefault();
    localStorage.removeItem("dobuCurrentUser");
    location.href = "login.html";
  });

  function updateUser(user) {
    const users = getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) { users[index] = user; saveUsers(users); }
  }

  function formatDate(value) {
    const d = new Date(`${value}T00:00:00`);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
  }

  const contactForm = document.querySelector("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      const alertBox = document.querySelector("#contactAlert");
      showAlert(alertBox, "success", "Thank you. Your message has been submitted (demo).");
      contactForm.reset();
    });
  }
});
