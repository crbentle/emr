const ADL_ACTIVITIES = [
	{
		name: 'Activity 1',
		options: ['Option 1', 'Option 2', 'Option 3'],
	},
	{
		name: 'Activity 2',
		options: ['Option 4', 'Option 5', 'Option 6'],
	},
];

var adlController = (function () {
	let patient;
	function buildADLDisplay(mrn) {
		patient = patientService.getPatient(mrn) || { mrn: mrn };

		const tbody = document.querySelector('#adl-tab-content table tbody');
		tbody.replaceChildren(...buildADLRows());
	}

	function buildADLRows() {
		const rows = [];
		ADL_ACTIVITIES.forEach((activity) => {
			const cols = [];
			cols.push(createElement('td', {text: activity.name}));
			['morning', 'afternoon', 'night'].forEach((shift) => {
				const savedValue = patient?.adl?.[activity.name]?.[shift] || '';
				const options = activity.options.map((option) => {
					return createElement('option', {
						attributes: { value: option, ...(savedValue === option ? {selected: ''} : null) },
						text: option,
					});
				});
				options.unshift(createElement('option'));

				const select = createElement('select', { attributes: { name: activity.name }, childNodes: options });
				const span = createElement('span', {attributes: {class: 'adl-data'}, text: savedValue})

				cols.push(createElement('td', { attributes: {'data-shift': shift}, childNodes: [select, span] }));

				select.onchange = (event) => {
					const value = event.target.value;
					const td = findParentByType(select, 'td');
					const span = td.querySelector('.adl-data') || td.appendChild(createElement('span', {attributes: {class: 'adl-data'}}));
					span.innerHTML = value;

					saveSelection(activity.name, shift, value);
				};
			});

			const tr = createElement('tr', { childNodes: cols });
			rows.push(tr);
		});
		return rows;
	}

	function saveSelection(activity, shift, value) {
		const adl = patient.adl || {};
		if(!adl[activity]){
			adl[activity] = {};
		}
		adl[activity][shift] = value;
		patient.adl = adl;
		patientService.saveData(patient.mrn, patient);
		
	}

	return {
		buildADLDisplay,
	};
})();
