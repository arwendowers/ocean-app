const speciesDiv = document.getElementById('ocean-species')
const form = document.querySelector('form')

form.onsubmit = async e => {
  e.preventDefault()
  const inputValue = form.speciesName.value.trim()
  if (!inputValue) return

  try {
    const url = new URL('https://skfqeznlqqprmvamwyrf.supabase.co/functions/v1/public-api/v1/search')
    url.searchParams.set('q', inputValue)
    url.searchParams.set('lang', 'en')

    const res = await fetch(url)
    if (res.status !== 200) throw new Error('Species not found')

    const { data } = await res.json()
    renderOceanSpecies(data[0])
    form.speciesName.value = ""
  } catch(err) {
    speciesDiv.innerHTML = 'Species not found'
  }
}

// uses localStorage to retrieve species user has favorited
function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]')
}


function saveFavorite(species) {
  const favs = getFavorites()
  // if species isn't favorited yet, add to favs
  if (!favs.find(f => f.scientific_name === species.scientific_name)) {
    favs.push(species)
    localStorage.setItem('favorites', JSON.stringify(favs))
  }
  renderFavorites()
}

function removeFavorite(scientificName) {
  // makes new array with every favorited species except the one you've requested to remove
  const favs = getFavorites().filter(f => f.scientific_name !== scientificName)
  localStorage.setItem('favorites', JSON.stringify(favs))
  renderFavorites()
}

function renderFavorites() {
  const list = document.getElementById('favorites-list')
  const favs = getFavorites()

  if (favs.length === 0) {
    list.innerHTML = '<p>No favorites yet.</p>'
    return
  }

  // makes a card button for each favorited species
  list.innerHTML = favs.map(s => `
    <div class="favorite-item">
      <button class="fav-view" data-name="${s.common_name}">
        <img src="${s.primary_photo}" alt="${s.common_name}">
        <span>${s.common_name}</span>
      </button>
      <button class="fav-remove" data-sci="${s.scientific_name}" aria-label="Remove">×</button>
    </div>
  `).join('')

  // renders the species card and hides modal when a species is clicked
  list.querySelectorAll('.fav-view').forEach(btn => {
    btn.onclick = () => {
      const species = favs.find(f => f.common_name === btn.dataset.name)
      if (species) {
        renderOceanSpecies(species)
        document.getElementById('favorites-modal').classList.add('hidden')
      }
    }
  })

  // removes species from favorites if remove button is clicked
  list.querySelectorAll('.fav-remove').forEach(btn => {
    btn.onclick = () => removeFavorite(btn.dataset.sci)
  })
}

function formatHabitat(habitat) {
  return habitat
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatBehavior(behavior) {
  return behavior
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const renderOceanSpecies = ({
  common_name,
  scientific_name,
  primary_photo,
  category,
  short_description,
  conservation_status,
  danger_level,
  habitats,
  behaviors,
  size,
  depth
}) => {
  speciesDiv.innerHTML = 
    `<div class="species-card">
      <div class="species-left">
        <img src="${primary_photo}" alt="${common_name}" class="species-img">
        <div class="species-tags">
          <span class="category">${capitalize(category)}</span>
          <span class="conservation_status ${conservation_status}">${conservation_status} - ${conservationTerms[conservation_status] || ''}</span>
        </div>
      </div>
      <div class="species-info">
        <h2 class="common_name">${common_name}</h2>
        <h3 class="scientific_name">${scientific_name}</h3>
        <p class="short_description">${short_description}</p>
        <p class="habitats"><strong>Habitats:</strong> ${habitats.map(formatHabitat).join(', ')}</p>
        <p class="behavior"><strong>Behaviors:</strong> ${(behaviors || []).map(formatBehavior).join(', ') || '-'}</p>
        <p class="danger_level"><strong>Danger Level:</strong> ${capitalize(danger_level)}</p>
        <p class="size"><strong>Size:</strong> ${centimetersToInches(size.min_cm)} - ${centimetersToInches(size.max_cm)} in (${centimetersToFeet(size.min_cm)} - ${centimetersToFeet(size.max_cm)} ft)</p>
        <p class="depth"><strong>Depth:</strong> ${metersToFeet(depth.min_m)} - ${metersToFeet(depth.max_m)} ft</p>
      </div>
      <button class="save-fav ${isFavorite ? 'saved' : ''}" type="button" aria-label="Save to favorites">${heart}</button>
    </div>`
  
  // if user clicks favorite button on a species:
  document.querySelector('.save-fav').onclick = () => {
    const btn = document.querySelector('.save-fav')
    const currentlySaved = btn.textContent === '♥'

    if (currentlySaved) {
      removeFavorite(scientific_name)
      btn.classList.remove('saved')
      btn.textContent = '♡'
    } else {
      saveFavorite({
        common_name,
        scientific_name,
        primary_photo,
        category,
        short_description,
        conservation_status,
        danger_level,
        habitats,
        behaviors,
        size,
        depth
      })
      btn.classList.add('saved')
      btn.textContent = '♥'
    }
  }
}

const isFavorite = getFavorites().some(f => f.scientific_name === scientific_name)
const heart = isFavorite ? '♥' : '♡'

const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

const centimetersToInches = cm => Math.round(cm / 2.54)
const centimetersToFeet = cm => Math.round(cm / 30.48)
const metersToFeet = m => Math.round(m * 3.28084)

const conservationTerms = {
  LC: 'Least Concern',
  NT: 'Near Threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically Endangered',
  EW: 'Extinct in the Wild',
  EX: 'Extinct',
  DD: 'Data Deficient',
  NE: 'Not Evaluated'
}

const modal = document.getElementById('favorites-modal')
const openBtn = document.getElementById('open-favorites')
const closeBtn = document.getElementById('close-favorites')

renderFavorites()

// opens favorites modal
openBtn.onclick = () => {
  renderFavorites()
  modal.classList.remove('hidden')
}

// closes favorites modal
closeBtn.onclick = () => {
  modal.classList.add('hidden')
}

// if user clicks outside the modal, it closes
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add('hidden')
}