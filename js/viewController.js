/**
 * Return the Date, formatted to an ISO-8601 date (yyyy-mm-dd).
 * If no date is passed in, the current date will be used.
 *
 * @param {Date} date The date to format
 * @returns The date in ISO-8601 format (yyyy-mm-dd)
 */
const getDateString = (date) => {
	if (!date) {
		date = new Date();
	}
	// toISOString always returns UTC time. Subtract the timezone offset (converted to miliseconds) to get the local date.
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
};

var viewController = (function () {
	let patient;
	const day = getDateString();

	function init() {
		setupTabs();
		buildPatientSelect();

		document.getElementById('login-form').addEventListener('submit', loginSubmit);

		document.getElementById('new-patient-btn').addEventListener('click', () => {
			showView('patient-search');
			const patientInfoDiv = document.getElementById('patient-info');
			patientInfoDiv.classList.add('hidden');
		});

		showView('signin');
	}

	/**
	 * Display the requested view and hide all others.
	 * Passing in a null or unknown view will result in all views being hidden.
	 *
	 * @param {"signin"|"patient-search"|"patient-chart"} viewName
	 */
	function showView(viewName) {
		const views = document.getElementsByClassName('view');
		for (let view of views) {
			if (view.id === `view-${viewName}`) {
				view.classList.add('active');
			} else {
				view.classList.remove('active');
			}
		}
	}

	function loginSubmit(event) {
		event.preventDefault();
		showView('patient-search');
	}

	/**
	 * Loop through all mock patients and build a patient selection view.
	 */
	function buildPatientSelect() {
		let patientCards = patientData.map((patient) => {
			const card = document.createElement('div');
			card.className = 'patient-card';

			const img = document.createElement('img');
			img.className = 'patient-img';
			img.src = './img/bust-in-silhouette.svg';
			card.appendChild(img);

			const name = document.createElement('strong');
			name.appendChild(document.createTextNode(`${patient.lastName}, ${patient.firstName} (${patient.mrn})`));
			card.appendChild(name);

			const dob = document.createElement('div');
			dob.appendChild(document.createTextNode(patient.dateOfBirth));
			card.appendChild(dob);

			card.addEventListener('click', (event) => {
				displayPatientInfo(patient.mrn);
			});
			return card;
		});

		document.getElementById('patient-cards').replaceChildren(...patientCards);
	}

	/**
	 * Handles hiding and displaying tab content when a tab is selected.
	 */
	function setupTabs() {
		const tabs = document.querySelectorAll('ul.nav-tabs > li');
		function onTabClick(tabClickEvent) {
			tabClickEvent.preventDefault();
			for (let i = 0; i < tabs.length; i++) {
				tabs[i].classList.remove('active');
			}
			const clickedTab = tabClickEvent.currentTarget;

			clickedTab.classList.add('active');
			const tabContentPanes = document.querySelectorAll('.tab-pane');
			for (let i = 0; i < tabContentPanes.length; i++) {
				tabContentPanes[i].classList.remove('active');
			}
			const anchorReference = tabClickEvent.target;
			const activePaneId = anchorReference.getAttribute('href');
			const activePane = document.querySelector(activePaneId);
			activePane.classList.add('active');
		}
		for (let i = 0; i < tabs.length; i++) {
			tabs[i].addEventListener('click', onTabClick);
		}
	}

	function displayPatientInfo(mrn) {
		patient = patientService.getPatient(mrn);

		if (!patient) {
			return;
		}

		showView('patient-chart');
		document.getElementById('patient-info').classList.remove('hidden');

		const displayName = `${patient.lastName}, ${patient.firstName} (${patient.mrn})`;
		document.getElementById('patient-name').textContent = displayName;
		document.getElementById('gender').textContent = patient.gender;
		document.getElementById('dob').textContent = patient.dateOfBirth;
		document.getElementById('age').textContent = patient.age;

		vitalSignsController.buildVitalSignsTable(patient.mrn);
		intakeAndOutputController.buildIntakeAndOutputDisplay(patient);
		adlController.buildADLDisplay(patient);
		notesController.initPatient(patient);
	}

	return {
		init,
		day,
		get patient() {
			return patient;
		},
	};
})();
