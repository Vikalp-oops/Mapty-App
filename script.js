'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration; //in minutes
    this.distance = distance; //in km
  }

  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this._setDiscription();
  }
  clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDiscription();
  }
  clacSpeed() {
    this.speed = this.duration / (this.distance / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const run2 = new Cycling([39, -12], 27, 29, 478);
// console.log(run1, run2);
///////////////////////////////////////////////////////////////
//APPLICATION ARC

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //position
    this._getposition();

    //event listermner
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationFeild);
    //isme this keyword ke sath bind nahi karenge kyuki isme uska ud=se hi nahi hai

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    //getting data from local storage
    this._getLocalStorage();

    //deleting an element
    containerWorkouts.addEventListener(
      'dblclick',

      this._deleteWorkout.bind(this)
    );
  }

  _getposition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('NOT ABLE TO GET YOUR LOCATION');
        }
      );
  }

  _loadMap(position) {
    {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);

      const coords = [latitude, longitude];

      this.#map = L.map('map').setView(coords, 13); //13 is zoom level

      L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.#map);

      //Handling click

      this.#map.on('click', this._showForm.bind(this));

      this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work);
      });
    }
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); //click karte hi sidha ty[pping shuru kar sakte hai]
  }

  _hideForm() {
    {
      //empty input
      inputDistance.value =
        inputDuration.value =
        inputCadence.value =
        inputElevation.value =
          '';
      // form.computedStyleMap.display = 'none';
      form.classList.add('hidden');
    }
  }

  _toggleElevationFeild() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // getting the data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value; //cadance aur elevation abhi nahi karenge kuyki vo alag alag store honge
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout = running create running object
    if (type === 'running') {
      const cadance = +inputCadence.value;
      // console.log(cadance);

      //check if the data is valid or not
      if (
        !validInput(distance, duration, cadance) ||
        !positive(distance, duration, cadance)
      )
        //   !Number.isFinite(distance) ||
        //   !Number.isFinite(duration) ||
        //   !Number.isFinite(cadance)
        // )
        return alert('Input must be a Positive Number');

      workout = new Running([lat, lng], distance, duration, cadance);
    }

    // if workout = Cycling then create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //check is valid or not
      if (
        !validInput(distance, duration, elevation) ||
        !positive(distance, duration)
      )
        //   !Number.isFinite(distance) ||
        //   !Number.isFinite(duration) ||
        //   !Number.isFinite(cadance)
        // )
        return alert('Input must be a Positive Number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //

    // display/render marker
    // console.log(this.#mapEventmapEvent);
    this._renderWorkoutMarker(workout);
    console.log(workout);
    //render workout on list
    this._renderWorkout(workout);

    //clear input feilds + Hide form
    this._hideForm();

    //Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, //pehla  popup close nahi hoga jab dursa  khule ga  (basically jo likha hai popup ke upar vo )
          closeOnClick: false, //pehla band nahi hoga jab dusra click karenge
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '⚡️'} ${workout.description}`
      )
      .openPopup();
    // console.log(workout.coords);
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '⚡️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
         
         `;

    if (workout.type === 'running')
      html += `
       
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
    // const editButtons = document.querySelectorAll('.workout__edit');

    // editButtons.forEach(button => {
    //   button.addEventListener('click', e => {
    //     const workoutEl = e.target.closest('.workout');
    //     const workout = this.#workouts.find(
    //       work => work.id === workoutEl.dataset.id
    //     );

    //     // Display a form with the current workout data pre-filled
    //     // Allow the user to edit the data
    //     // Once the user submits the form, update the workout object with the new data
    //     // Re-render the workout element
    //   });
  }
  _deleteWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workoutId = workoutEl.dataset.id;
    const workoutIndex = this.#workouts.findIndex(
      work => work.id === workoutId
    );
    this.#workouts.splice(workoutIndex, 1);
    workoutEl.remove(); // remove the workout element from the DOM
    const popup = this.#map._popup;
    if (popup && popup.options.id === workoutId) {
      this.#map.removeLayer(popup);
    }
    const marker = this.#map._layers[workoutId];
    if (marker) {
      this.#map.removeLayer(marker);
    }
    this._setLocalStorage();
  }
}

const app = new App();
