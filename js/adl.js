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
	let patient, adlData;
	function buildADLDisplay(patient) {
		patient = patient;
		adlData = patient?.adl?.find((data) => data.day === viewController.day) || { day: viewController.day };

		const tbody = document.querySelector('#adl-tab-content table tbody');
		tbody.replaceChildren(...buildADLRows());
	}

	function buildADLRows() {
		const rows = [];
		ADL_ACTIVITIES.forEach((activity) => {
			const cols = [];
			cols.push(createElement('td', {text: activity.name}));
			['morning', 'afternoon', 'night'].forEach((shift) => {
				const savedValue = adlData?.[activity.name]?.[shift] || '';
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
					const td = findParentOfType(select, 'td');
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
		if(!adlData[activity]){
			adlData[activity] = {};
		}
		adlData[activity][shift] = value;
		// Only keep the last 3 histories
		patient.adl = (patient.adl?.filter((adl) => adl.day !== viewController.day) || []).concat([adlData]).slice(-3);

		patientService.saveData(patient.mrn, patient);
		
	}

	return {
		buildADLDisplay,
	};
})();
