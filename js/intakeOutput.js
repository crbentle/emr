var intakeAndOutputController = (function () {
	const IO_DATA_KEYS = [
		'intake.po',
		'intake.iv',
		'intake.tube',
		'intake.other',
		'output.urine',
		'output.emesis',
		'output.ng',
		'output.stool',
		'output.other',
	];
	const SHIFTS = ['morning', 'afternoon', 'night'];
	let patient, ioData, day;

	function buildIntakeAndOutputDisplay(mrn) {
		patient = patientService.getPatient(mrn) || { mrn: mrn };
		day = getDateString(new Date());
		ioData = patient?.io?.find((data) => data.day === day) || { day: day };

		const container = document.getElementById('intake_output_content');
		container.replaceChildren(...buildIOTables(ioData));

		container.querySelectorAll('input').forEach((input) => {
			input.addEventListener('blur', saveInput);
		});

		setSummaryTotal();
	}

	/**
	 * Build an Intake & Output table for each shift
	 *
	 * @param {*} ioData
	 * @returns A NodeList of tables
	 */
	function buildIOTables(ioData) {
		return SHIFTS.map((shift) => buildIOTable(shift, ioData));
	}

	/**
	 * Clone the '#io-table-template' template and populate it with Intake & Output details for a particular shift.
	 *
	 * @param {('morning'|'afternoon'|'night')} shift The shift name
	 * @param {*} data The patient's intake/output data for today
	 * @returns The intake/output table Node
	 */
	function buildIOTable(shift, data) {
		const table = document.querySelector('#io-table-template').content.cloneNode(true).querySelector('table');
		table.id = `io-${shift}`;
		const caption = table.querySelector('caption');
		caption.classList.add(`io-${shift}-bg`);
		caption.innerHTML = getShiftTitle(shift);

		const tbody = table.querySelector('tbody');

		getShiftHours(shift).forEach((hour) => {
			tbody.appendChild(buildHourRow(hour, data));
		});

		setTableTotal(table, 'intake');
		setTableTotal(table, 'output');

		return table;
	}

	/**
	 * Build the Intake/Output row for a particular hour.
	 *
	 * @param {int} hour
	 * @param {*} ioData
	 * @returns The tr Node
	 */
	function buildHourRow(hour, ioData) {
		const timeData = ioData?.[hour];

		const date = new Date();
		date.setHours(hour, 0, 0, 0);
		const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });

		const tr = createElement('tr');

		tr.appendChild(
			createElement('td', { attributes: { class: 'io-time' }, childNodes: [document.createTextNode(time)] })
		);

		// Create a column and <input> for each i/o type
		IO_DATA_KEYS.forEach((complexKey) => {
			const [type, key] = complexKey.split('.');
			tr.appendChild(
				createElement('td', {
					childNodes: [
						createElement('input', {
							attributes: {
								size: '1',
								value: timeData?.[type]?.[key] || '',
								'data-key': `${hour}.${type}.${key}`,
							},
						}),
					],
				})
			);
		});

		return tr;
	}

	/**
	 * Sum of all 'intake' or 'output' inputs for the table and update the appropriate summary value.
	 * This method will also call setSummaryTotal() to update the summary section.
	 *
	 * @param {Node} table The table to total
	 * @param {('intake'|'output')} type The total type (intake or output)
	 */
	function setTableTotal(table, type) {
		const element = table.querySelector(`.io-${type}-total`);
		const sum = getSum(table, type);
		element.innerHTML = `${sum.toLocaleString()} ml`;

		document.getElementById(`${table.id}-${type}-summary`).innerHTML = sum;

		setSummaryTotal();
	}

	/**
	 * Sum all intake and output values across all shifts and update the summary details.
	 */
	function setSummaryTotal() {
		let intakeSummaryNode = document.getElementById(`summary-daily-intake`);
		let intakeSum = getSum(document, 'intake');
		intakeSummaryNode.innerHTML = `${intakeSum.toLocaleString()} ml`;

		let outputSummaryNode = document.getElementById(`summary-daily-output`);
		let outputSum = getSum(document, 'output');
		outputSummaryNode.innerHTML = `${outputSum.toLocaleString()} ml`;

		const summaryDifferenceNoe = document.getElementById(`summary-daily-difference`);
		summaryDifferenceNoe.innerHTML = `${(intakeSum - outputSum).toLocaleString()} ml`;
	}

	/**
	 * Sum all inputs under the parent node that have a data-key value matching the requested type.
	 *
	 * @param {Node} parentNode The parent element for which to sum all child inputs
	 * @param {('intake'|'output')} type The type of sum to get (intake or output)
	 * @returns The sum
	 */
	function getSum(parentNode, type) {
		return [...parentNode.querySelectorAll('input')]
			.filter((input) => input.dataset?.['key']?.includes(type))
			.map((input) => input.value || 0)
			.reduce((sum, value) => sum + Number(value), 0);
	}

	/**
	 * Get the list of hours that belong to a shift.
	 *
	 * @param {('morning'|'afternoon'|'night')} shift The shift name
	 * @returns A sorted array of hours for the shift
	 */
	function getShiftHours(shift) {
		switch (shift) {
			case 'morning':
				return [7, 8, 9, 10, 11, 12, 13, 14];
			case 'afternoon':
				return [15, 16, 17, 18, 19, 20, 21, 22];
			case 'night':
				return [23, 24, 1, 2, 3, 4, 5, 6];
			default:
				return [];
		}
	}

	/**
	 * Returns the shift name that applies to the given hour.
	 *
	 * @param {int} hour The hour of the day, in 24-hour format
	 * @returns {('morning'|'afternoon'|'night')} The shift that contains the hour
	 */
	function getShiftFromHour(hour) {
		if (hour >= 7 && hour <= 14) {
			return 'morning';
		}
		if (hour >= 15 && hour <= 22) {
			return 'afternoon';
		}
		return 'night';
	}

	/**
	 * Build a shift table title by upper-casing the first letter of a shift name and appending ' Shift'
	 *
	 * @param {String} shift
	 * @returns
	 */
	function getShiftTitle(shift) {
		return shift.charAt(0).toUpperCase() + shift.substring(1) + ' Shift';
	}

	/**
	 * Return the Date, formatted to an ISO-8601 date (yyyy-mm-dd).
	 *
	 * @param {Date} date The date to format
	 * @returns The date in ISO-8601 format (yyyy-mm-dd)
	 */
	function getDateString(date) {
		// toISOString always returns UTC time. Subtract the timezone offset (converted to miliseconds) to get the local date.
		return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
	}

	/**
	 * Save the event target's value to local storage.
	 *
	 * This method will build out the necessary patient.io structure if this is the first time 
	 * saving a value for this patient, day, field, etc.
	 *
	 * @param {Event} event The event that triggered the save
	 */
	function saveInput(event) {
		// Remove any non-numeric characters
		event.target.value = event.target.value.replace(/\D/g, '');
		const value = Number(event.target.value) || undefined;
		const key = event.target.dataset.key;
		const [hour, type, field] = key.split('.');
		const previousValue = ioData[hour]?.[type]?.[field];

		if (value !== previousValue) {
			if (!ioData[hour]) {
				ioData[hour] = {};
			}
			if (!ioData[hour][type]) {
				ioData[hour][type] = {};
			}
			ioData[hour][type][field] = value;

			// Only keep the last 3 histories
			patient.io = (patient.io?.filter((io) => io.day !== day) || []).concat([ioData]).slice(-3);

			patientService.saveData(patient.mrn, patient);

			setTableTotal(document.getElementById(`io-${getShiftFromHour(hour)}`), type);
		}
	}

	return {
		buildIntakeAndOutputDisplay,
	};
})();
