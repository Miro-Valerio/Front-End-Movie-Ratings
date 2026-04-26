const API = 'https://semi-final-project-exam-movie-rating-web.onrender.com';

let movies = [];
let reviews = [];
let avgRatings = {};
let selectedRating = 0;

/* TAB */
function setActiveTab(event) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
}

/* SHOW MOVIES */
async function showMovies(event) {
  if (event) setActiveTab(event);

  const res = await fetch(API + '/movies');
  movies = await res.json();

  for (let m of movies) {
    const avgRes = await fetch(API + `/movies/${m.id}/average-rating`);
    const avg = await avgRes.json();
    avgRatings[m.id] = avg.average || 0;
  }

  let html = '<div class="movies-list">';

  if (movies.length === 0) {
    html += '<div class="empty">No movies yet. Add one!</div>';
  } else {
    movies.forEach(m => {
      html += `
        <div class="movie-item" onclick="showDetail(${m.id})">
          ${m.image 
            ? `<img src="${m.image}" class="movie-img">`
            : `<div class="movie-img"></div>`}

          <div class="movie-info">
            <div class="movie-title">${m.title}</div>
            <div class="movie-desc">${m.description || 'No description'}</div>
            <div style="color:#EF9F27;">★ ${avgRatings[m.id] || 'Not rated'}</div>
          </div>

          <div class="movie-actions">
            <button class="small-btn" onclick="event.stopPropagation(); showEdit(${m.id})">Edit</button>
            <button class="small-btn danger" onclick="event.stopPropagation(); deleteMovie(${m.id})">Delete</button>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

/* ADD FORM */
function showAdd(event) {
  if (event) setActiveTab(event);

  document.getElementById('content').innerHTML = `
    <div class="form-section">
      <h3>Add Movie</h3>

      <div class="form-label">Title *</div>
      <input type="text" id="title">

      <div class="form-label">Description</div>
      <textarea id="desc"></textarea>

      <div class="form-label">Image</div>
      <input type="file" id="image">
      <img id="preview" class="img-preview">

      <button class="btn" onclick="submitMovie()">Add Movie</button>
    </div>
  `;

  document.getElementById('image').addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

/* SUBMIT MOVIE */
async function submitMovie() {
  const title = document.getElementById('title').value.trim();
  if (!title) return alert('Title required');

  const description = document.getElementById('desc').value.trim();

  let image = '';
  const file = document.getElementById('image').files[0];

  if (file) {
    image = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  await fetch(API + '/movies', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ title, description, image })
  });

  showMovies();
}

/* EDIT MOVIE */
async function showEdit(id) {
  const movie = movies.find(m => m.id == id);
  if (!movie) return alert('Movie not found');

  document.getElementById('content').innerHTML = `
    <div class="form-section">
      <button class="btn" onclick="showMovies()">Back</button>
      <h3>Edit Movie</h3>

      <div class="form-label">Title *</div>
      <input type="text" id="title" value="${movie.title}">

      <div class="form-label">Description</div>
      <textarea id="desc">${movie.description || ''}</textarea>

      <div class="form-label">Image</div>
      <input type="file" id="image">
      <img id="preview" class="img-preview" src="${movie.image || ''}" style="display: ${movie.image ? 'block' : 'none'};">

      <button class="btn" onclick="submitEdit(${movie.id})">Save Changes</button>
      <button class="btn danger" onclick="deleteMovie(${movie.id})">Delete Movie</button>
    </div>
  `;

  document.getElementById('image').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

async function submitEdit(id) {
  const title = document.getElementById('title').value.trim();
  if (!title) return alert('Title required');

  const description = document.getElementById('desc').value.trim();
  const file = document.getElementById('image').files[0];

  let body = { title, description };

  if (file) {
    body.image = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  const res = await fetch(API + `/movies/${id}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.json();
    return alert(error.message || 'Unable to update movie');
  }
  showMovies();
}

async function deleteMovie(id) {
  if (!confirm('Delete this movie?')) return;

  const res = await fetch(API + `/movies/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const error = await res.json();
    return alert(error.message || 'Unable to delete movie');
  }

  showMovies();
}

/* DETAIL */
async function showDetail(id) {
  const movie = movies.find(m => m.id == id);

  const revRes = await fetch(API + `/reviews/${id}`);
  reviews = await revRes.json();

  document.getElementById('content').innerHTML = `
    <div class="detail-header">
      <button class="btn" onclick="showMovies()">Back</button>
      <div>
        <button class="btn" onclick="showEdit(${movie.id})">Edit</button>
        <button class="btn danger" onclick="deleteMovie(${movie.id})">Delete</button>
      </div>
    </div>

    <div class="form-section">
      <h2>${movie.title}</h2>
      <p>${movie.description || ''}</p>
    </div>

    <div class="form-section">
      <h3>Rate</h3>

      <div class="form-label">Name</div>
      <input type="text" id="rev-user" placeholder="Your name">

      <div id="star-picker"></div>
      <textarea id="rev-comment"></textarea>
      <button class="btn" onclick="submitReview(${id})">Submit</button>
    </div>

    <div id="reviews-list"></div>
  `;
  renderStars();
  renderReviews();
}

/* STARS */
function renderStars() {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i<=selectedRating?'filled':''}" 
    onclick="selectedRating=${i};renderStars()">★</span>`;
  }
  document.getElementById('star-picker').innerHTML = html;
}

/* SUBMIT REVIEW */
async function submitReview(id) {
  const text = document.getElementById('rev-comment').value;
  const user = document.getElementById('rev-user').value || "Anonymous";

  await fetch(API + '/reviews', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      movieId: id,
      rating: selectedRating,
      text,
      user
    })
  });

  selectedRating = 0;
  showDetail(id);
}

/* REVIEWS */
function renderReviews() {
  document.getElementById('reviews-list').innerHTML =
    reviews.length
      ? reviews.map(r => `
          <div class="review-item">
            <b>${r.user}</b> ★ ${r.rating}
            <div>${r.text}</div>
          </div>
        `).join('')
      : '<div class="empty">No reviews yet</div>';
}

showMovies();