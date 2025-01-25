const ADL_ACTIVITIES = [
	{
		group: 'Bathing',
		activities: [
			{
				name: 'Activity 1',
				options: ['Option 1', 'Option 2', 'Option 3'],
			},
			{
				name: 'Activity 2',
				options: ['Option 4', 'Option 5', 'Option 6'],
			},
		],
	},
	{
		group: 'Feeding',
		activities: [
			{
				name: 'Breakfast',
				options: ['0%', '25%', '50%', '75%', '100%'],
			},
			{ name: 'Lunch', options: ['0%', '25%', '50%', '75%', '100%'] },
			{ name: 'Dinner', options: ['0%', '25%', '50%', '75%', '100%'] },
		],
	},
	{
		group: 'Another Group',
		activities: [
			{
				name: 'Breakfast',
				options: ['0%', '25%', '50%', '75%', '100%'],
			},
			{ name: 'Lunch', options: ['0%', '25%', '50%', '75%', '100%'] },
			{ name: 'Dinner', options: ['0%', '25%', '50%', '75%', '100%'] },
		],
	},
];

var adlController = (function () {
	let patient, adlData;
	function buildADLDisplay(viewPatient) {
		patient = viewPatient;
		adlData = patient?.adl?.find((data) => data.day === viewController.day) || { day: viewController.day };

		// Clear old data and build a new table
		const table = document.querySelector('#adl-tab-content table');
		table.querySelectorAll('tbody').forEach((tbody) => tbody.remove());
		table.append(...ADL_ACTIVITIES.map(buildGroup));
	}

	/**
	 * Build a tbody for each group in the ADL Activities list
	 *
	 * @param {*} group
	 * @returns tbody DOM element
	 */
	function buildGroup(group) {
		const rows = group.activities.map(buildActivityRow);

		if (rows?.length) {
			rows[0].prepend(buildGroupLabel(group));
		}

		rows.push(createElement('tr', {attributes: {class: 'group-spacer'}}))

		return createElement('tbody', { childNodes: rows });
	}

	/**
	 * Create a cell that displays the group name and spans all of the group's activity rows.
	 *
	 * @param {*} group
	 * @returns A td HTMLElement
	 */
	function buildGroupLabel(group) {
		return createElement('td', {
			attributes: {
				rowspan: group.activities.length,
				class: 'group',
			},
			childNodes: [
				createElement('div', {
					attributes: { class: 'group-label' },
					childNodes: [createElement('span', { text: group.group })],
				}),
			],
		});
	}

	function buildActivityRow(activity) {
		const cols = [];
		cols.push(
			createElement('td', {
				attributes: { class: 'activity-label' },
				text: activity.name,
			})
		);

		['morning', 'afternoon', 'night'].forEach((shift) => {
			cols.push(createOptionCell(activity, shift));
		});

		return createElement('tr', { childNodes: cols });
	}

	function createOptionCell(activity, shift) {
		const savedValue = adlData?.[activity.name]?.[shift] || '';
		const options = activity.options.map((option) => {
			return createElement('option', {
				attributes: { value: option, ...(savedValue === option ? { selected: '' } : null) },
				text: option,
			});
		});
		options.unshift(createElement('option'));

		const select = createElement('select', {
			attributes: { name: activity.name },
			childNodes: options,
		});
		const span = createElement('span', { attributes: { class: 'adl-data' }, text: savedValue });

		select.onchange = (event) => {
			const value = event.target.value;
			const td = findParentOfType(select, 'td');
			const span =
				td.querySelector('.adl-data') ||
				td.appendChild(createElement('span', { attributes: { class: 'adl-data' } }));
			span.innerHTML = value;

			saveSelection(activity.name, shift, value);
		};

		return createElement('td', { attributes: { 'data-shift': shift }, childNodes: [select, span] });
	}

	function saveSelection(activity, shift, value) {
		if (!adlData[activity]) {
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
