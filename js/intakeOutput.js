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
	let patient, ioData, day;

	function buildIntakeAndOutputDisplay(mrn) {
		patient = patientService.getPatient(mrn) || { mrn: mrn };
		day = getDateString(new Date());
		ioData = patient?.io?.find((data) => data.day === day) || { day: day };

		const container = document.getElementById('intake_output_content');
		container.replaceChildren(...buildIOTables(ioData));

		setSummaryTotal();
	}

	function buildIOTables(ioData) {
		return ['morning', 'afternoon', 'night'].map((shift) => buildIOTable(shift, ioData));
	}

	function buildIOTable(shift, data) {
		const table = document.querySelector('#io-table-template').content.cloneNode(true).querySelector('table');

		table.id = `io-${shift}`;
		const caption = table.querySelector('caption');
		caption.classList.add(`io-${shift}-bg`);
		caption.innerHTML = getShiftTitle(shift);

		const tbody = table.querySelector('tbody');

		const date = new Date();
		getShiftHours(shift).forEach((hour) => {
			tbody.appendChild(buildHourRow(hour, data));
		});

		setTotal(table, 'intake');
		setTotal(table, 'output');

		table.querySelectorAll('input').forEach((input) => {
			input.addEventListener('blur', saveInput);
		});

		return table;
	}

	function buildHourRow(hour, ioData) {
		const timeData = ioData?.[hour];

		const date = new Date();
		date.setHours(hour, 0, 0, 0);
		const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });

		const tr = createElement('tr');

		tr.appendChild(
			createElement('td', { attributes: { class: 'io-time' }, childNodes: [document.createTextNode(time)] })
		);

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

	function setTotal(table, type) {
		const element = table.querySelector(`.io-${type}-total`);
		// let sum = [...table.querySelectorAll('input')]
		// 	.filter((input) => input.dataset?.['key']?.includes(type))
		// 	.map((input) => input.value || 0)
		// 	.reduce((sum, value) => sum + Number(value), 0);
		const sum = getSum(table, type);
		element.innerHTML = `${sum.toLocaleString()} ml`;

		document.getElementById(`${table.id}-${type}-summary`).innerHTML = sum;
		//io-night-output-summary

		setSummaryTotal();
		

	}

	function setSummaryTotal() {
		// Set summary totals
		//summary-morning-intake
		let intakeSummaryNode = document.getElementById(`summary-daily-intake`);
		let intakeSum = getSum(document, 'intake');
		intakeSummaryNode.innerHTML = `${intakeSum.toLocaleString()} ml`;

		let outputSummaryNode = document.getElementById(`summary-daily-output`);
		let outputSum = getSum(document, 'output');
		outputSummaryNode.innerHTML = `${outputSum.toLocaleString()} ml`;

		//
		const summaryDifferenceNoe = document.getElementById(`summary-daily-difference`);
		summaryDifferenceNoe.innerHTML = `${(intakeSum - outputSum).toLocaleString()} ml`;
	}

	function getSum(parentNode, type) {
		return [...parentNode.querySelectorAll('input')]
			.filter((input) => input.dataset?.['key']?.includes(type))
			.map((input) => input.value || 0)
			.reduce((sum, value) => sum + Number(value), 0);
	}

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

	function getShiftFromHour(hour) {
		if (hour >= 7 && hour <= 14) {
			return 'morning';
		}
		if (hour >= 15 && hour <= 22) {
			return 'afternoon';
		}
		return 'night';
	}

	function getShiftTitle(shift) {
		return shift.charAt(0).toUpperCase() + shift.substring(1) + ' Shift';
	}

	function getDateString(date) {
		/**
		 * toISOString always returns UTC time. Subtract the timezone offset (converted to miliseconds) to get the local date.
		 */
		return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
	}

	function saveInput(event) {
		// Remove any non-numeric characters
		event.target.value = event.target.value.replace(/\D/g,'');
		const value = Number(event.target.value) || undefined;
		const key = event.target.dataset?.key;
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

			setTotal(document.getElementById(`io-${getShiftFromHour(hour)}`), type);
		}
	}

	return {
		buildIntakeAndOutputDisplay,
	};

	// buildIntakeAndOutputDisplay('2496219881');
})();