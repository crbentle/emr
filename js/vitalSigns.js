var vitalSignsController = (function () {
	let saveHandler;
	function buildVitalSignsTable(mrn, options = {}) {
		const { editDate, savedDate } = options;

		// TODO: Save vital signs in order so we don't need to sort
		// TODO: Handle cancel edit

		// Get saved vital signs
		let vitalSigns = [...getVitalSigns(mrn)]
			// Sort by date, oldest first
			.sort((a, b) => a.date - b.date)
			// Remove all but the last 3 vital signs
			?.slice(-3);

		const table = createElement('table', {
			attributes: {
				class: 'vs-table',
			},
			childNodes: [
				createColGroup(findDateColumnIndex(vitalSigns, savedDate)),
				createHead({ vitalSigns }),
				createBody(vitalSigns, { editingIndex: findDateColumnIndex(vitalSigns, editDate) }),
				createFooter(findDateColumnIndex(vitalSigns, editDate), vitalSigns?.length),
			],
		});

		// Setup validation on vital-sign inputs
		table.querySelectorAll('.vital-sign-input input').forEach((input) => {
			input.addEventListener('blur', validateVitalSign);
			input.addEventListener(
				'input',
				(event) => (event.target.value = event.target.value.replace(/[^\d.]/g, ''))
			);
		});

		table.querySelectorAll('.vs-edit').forEach((input) => {
			input.addEventListener('click', (event) => {
				buildVitalSignsTable(mrn, { editDate: Number(event.target.dataset?.date) });
			});
		});

		// TODO: Move form creation here? (Would elimated the need to remove listener)
		const form = document.getElementById('vital-sign-form');

		form.removeEventListener('submit', handleSave);
		form.addEventListener('submit', handleSave);

		const mrnInput = createElement('input', {
			attributes: {
				type: 'hidden',
				id: 'vital-sign-mrn',
				name: 'vital-sign-mrn',
				value: mrn,
			},
		});

		let formContent = [mrnInput, table];

		if (editDate) {
			formContent.push(
				createElement('input', {
					attributes: {
						type: 'hidden',
						id: 'editDate',
						name: 'editDate',
						value: editDate,
					},
				})
			);
		}

		document.getElementById('vs-form-content').replaceChildren(...formContent);

		return table;
	}

	function createColGroup(saveIndex) {
		if (saveIndex < 0) {
			return null;
		}

		const group = createElement('colgroup');
		group.insertAdjacentHTML(
			'beforeend',
			`<col span="${1 + saveIndex}">
            <col class="save-flash">`
		);

		// Remove the 'save-flash' class after the animation finishes
		const saveCol = group.lastChild;
		saveCol.addEventListener('animationend', () => saveCol.classList.remove('save-flash'), false);

		return group;
	}

	function createHead({ vitalSigns }) {
		const thead = createElement('thead');
		const row = createElement('tr');
		thead.appendChild(row);

		// Empty cell above Vital Sign lables
		row.appendChild(createElement('th'));

		// TODO: Flag editing class?
		for (let i = 0; i < 3; i++) {
			const header = createElement('th');
			const div = createElement('div');
			const dateSpan = createElement('span', { attributes: { class: 'vs-date' } });
			const timeSpan = createElement('span', { attributes: { class: 'vs-time' } });

			div.insertAdjacentHTML(
				'beforeend',
				`<td>${getVitalSignForColumn({ vitalSigns, type: 'date', columnIndex: i })}</td>`
			);

			header.appendChild(div);
			row.appendChild(header);
		}

		// The 'today' input column
		const header = createElement('th');
		header.appendChild(
			createElement('div', {
				attributes: {
					classs: 'vital-sign-input',
					id: 'vital-sign-today',
				},
				childNodes: [document.createTextNode(new Date().toLocaleDateString())],
			})
		);
		row.appendChild(header);

		return thead;
	}

	function createBody(vitalSigns, options = {}) {
		const { editingIndex } = options;
		const body = createElement('tbody');

		let vsTypes = ['temp', 'pulse', 'resp', 'bp', 'o2', 'pain', 'height', 'weight'];

		vsTypes.forEach((type) => body.appendChild(createBodyRow(type, vitalSigns, editingIndex)));

		return body;
	}

	function createFooter(editingIndex, vitalSignsCount) {
		const footer = createElement('tfoot');
		const row = createElement('tr');
		footer.appendChild(row);
		row.appendChild(createElement('td')); // Empty cell below labels
		let saveButtonAdded = false;
		for (let i = 0; i < 4; i++) {
			const cell = createElement('td');
			if (i === editingIndex || (i === 3 && !saveButtonAdded)) {
				saveButtonAdded = true;
				cell.insertAdjacentHTML(
					'beforeend',
					`<button type="submit" class="btn btn-green" id="vital-sign-save-btn">Save</button>`
				);
			}
			row.appendChild(cell);
		}
		return footer;
	}

	function createBodyRow(vitalSignType, vitalSigns, editingIndex) {
		/* TODO:
		 * - if last column != editingIndex, disable inputs and don't add name or id
		 */
		const row = createElement('tr');
		row.appendChild(
			createElement('td', {
				attributes: {
					class: 'vital-sign-label',
				},
				childNodes: [document.createTextNode(getVitalSignLabel(vitalSignType))],
			})
		);

		// TODO: Change input classes and add left+right padding
		for (let i = 0; i < 3; i++) {
			if (i === editingIndex || i === 3) {
				let vitalSignIndex = vitalSigns?.length - 3 + i;
				row.appendChild(createInputCell(vitalSignType, vitalSigns[vitalSignIndex]));
			} else {
				row.insertAdjacentHTML(
					'beforeend',
					`<td>${getVitalSignForColumn({ vitalSigns, type: vitalSignType, columnIndex: i })}</td>`
				);
			}
		}

		let inputsDisabled = editingIndex >= 0;
		row.appendChild(createInputCell(vitalSignType, null, inputsDisabled));

		return row;
	}

	function createInputCell(vitalSignType, vitalSigns, disabled) {
		const cell = createElement('td');
		const div = createElement('div', { attributes: { class: 'vital-sign-input' } });
		const container = createElement('div', { attributes: { class: 'vital-input-container' } });
		cell.appendChild(div);
		div.appendChild(container);

		let input = null;

		switch (vitalSignType) {
			case 'bp':
				let sysInput = createElement('input', {
					attributes: { size: 3, maxlength: 3, inputmode: 'numeric', pattern: '[0-9]{0,3}' },
				});
				let diaInput = createElement('input', {
					attributes: { size: 3, maxlength: 3, inputmode: 'numeric', pattern: '[0-9]{0,3}' },
				});
				if (disabled) {
					sysInput.disabled = true;
					diaInput.disabled = true;
				} else {
					sysInput.id = 'bp-sys';
					sysInput.name = 'bp-sys';
					sysInput.value = vitalSigns?.bp?.sys || '';

					diaInput.id = 'bp-dia';
					diaInput.name = 'bp-dia';
					diaInput.value = vitalSigns?.bp?.dia || '';
				}
				container.replaceChildren(sysInput, createElement('span', { attributes: { class: 'mx-2' } }), diaInput);
				break;
			case 'temp':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="temperature" name="temperature" maxlength="5" value="${vitalSigns?.temp || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
			case 'pulse':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="pulse" name="pulse" maxlength="3" value="${vitalSigns?.pulse || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
			case 'o2':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="o2" name="o2" maxlength="3" value="${vitalSigns?.o2 || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
			case 'resp':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="respirations" name="respirations" maxlength="3" value="${vitalSigns?.resp || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
			case 'pain':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="pain" name="pain" maxlength="2" value="${vitalSigns?.pain || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
			case 'height':
				let valueFeet = '';
				let valueInches = '';
				if (vitalSigns?.height) {
					valueFeet = Math.floor(vitalSigns.height / 12);
					valueInches = vitalSigns.height % 12;
				}
				container.insertAdjacentHTML(
					'beforeend',
					`
													<input id="height-feet" name="height-feet" size="3" maxlength="3" placeholder="feet" value="${valueFeet}" ${
						disabled ? ' disabled' : ''
					}>
													<span class="mx-2">/</span>
													<input id="height-inches" name="height-inches" size="3" maxlength="3" placeholder="inches" value="${valueInches}" ${
						disabled ? ' disabled' : ''
					}>
												`
				);
				break;
			case 'weight':
				container.insertAdjacentHTML(
					'beforeend',
					`<input id="weight" name="weight" maxlength="3" value="${vitalSigns?.weight || ''}" ${
						disabled ? ' disabled' : ''
					}>`
				);
				break;
		}

		return cell;
	}

	function getVitalSignLabel(type) {
		let label = '';
		switch (type) {
			case 'bp':
				label = 'Blood Pressure';
				break;
			case 'temp':
				label = 'Temperature (F)';
				break;
			case 'pulse':
				label = 'Heart Rate';
				break;
			case 'o2':
				label = 'Oxygen Saturation';
				break;
			case 'resp':
				label = 'Respirations';
				break;
			case 'pain':
				label = 'Pain (0-10)';
				break;
			case 'height':
				label = 'Height';
				break;
			case 'weight':
				label = 'Weight (lbs)';
				break;
		}

		return label;
	}

	/**
	 * Get the vital sign value corresponding to the data type and
	 * format the data for display, if needed.
	 */
	function getVitalSignForColumn({ vitalSigns, type, columnIndex }) {
		//let vitalSignIndex = vitalSigns?.length - 3 + i;
		if (!(vitalSigns?.length >= 3 - columnIndex)) {
			return '';
		}

		const vitalSign = vitalSigns[vitalSigns.length - 3 + columnIndex];
		if (!vitalSign) {
			return '';
		}

		let value = '';
		switch (type) {
			case 'date':
				if (vitalSign.date) {
					const date = new Date(vitalSign.date);
					value = `
								<div>${date.toLocaleDateString()}
								<span class="vs-edit" title="Edit" data-date=${vitalSign.date}></span>
									<span class="vital-sign-history-time">${date.toTimeString().substring(0, 5)}</span>	
								</div>`;
				}
				break;
			case 'bp':
				if (vitalSign.bp?.sys || vitalSign.bp?.dia) {
					value = `${vitalSign.bp.sys || ''}/${vitalSign.bp.dia || ''}`;
				}
				break;
			case 'height':
				if (vitalSign.height) {
					value = `${Math.floor(vitalSign.height / 12)}' ${vitalSign.height % 12}"`;
				}
				break;
			default:
				// dataType and JSON key are the same
				value = vitalSign[type];
		}
		return value;
	}

	function createElement(type, { attributes, classList, id, childNodes } = {}) {
		const element = document.createElement(type);
		if (attributes) {
			for (let [key, value] of Object.entries(attributes)) {
				element.setAttribute(key, value);
			}
		}

		childNodes?.forEach((node) => {
			if (node) {
				element.appendChild(node);
			}
		});

		return element;
	}

	function setElementClass(element, ...classList) {
		element.classList.add(...classList);
	}

	/**
	 * Find the index of a vital sign with the matching date.
	 * @param {VitalSign[]} vitalSignArray
	 * @param {Number} date
	 * @returns
	 */
	function findVitalSignIndex(vitalSignArray, date) {
		return vitalSignArray?.findIndex((vitalSigns) => vitalSigns?.date === date);
	}

	/**
	 * Find the index of the column in the vital signs table that contains the record with matching date.
	 * A full history (of 3 vital signs) would mean the vitalSignIndex and columnIndex would match. If the vital sign
	 * array has fewer than 3 items, we need to shift the column index to account for empty columns.
	 * @param {*} vitalSignArray
	 * @param {*} date
	 */
	function findDateColumnIndex(vitalSignArray, date) {
		const vitalSignIndex = findVitalSignIndex(vitalSignArray, date);

		if (vitalSignIndex >= 0) {
			return 3 - vitalSignArray.length + vitalSignIndex;
		}

		return -1;
	}

	function handleSave(event) {
		event.preventDefault();

		const formData = new FormData(document.getElementById('vital-sign-form'));
		let savedDate = saveVitalSigns(formData);

		if (!savedDate) {
			return;
		}

		const mrn = formData.get('vital-sign-mrn');
		buildVitalSignsTable(mrn, { savedDate: savedDate });
	}

	/**
	Normal Values: (red flag outside normal)
		- Temp: 97.6-99.6 
		- Pulse: 60-100
		- Resp: 12-20
		- Oxygen Saturation: >=90
		- BP: 90-150 / 50-90
				 */
	const validateVitalSign = (event) => {
		let inputId = event.target.id;
		let value = Number(event.target.value);
		if (!value) {
			event.target.classList.remove('abnormal');
			return;
		}

		let inRange = true;

		switch (inputId) {
			case 'bp-sys':
				inRange = value >= 90 && value <= 150;
				break;
			case 'bp-dia':
				inRange = value >= 50 && value <= 90;
				break;
			case 'temperature':
				inRange = value >= 97.6 && value <= 99.6;
				break;
			case 'pulse':
				inRange = value >= 60 && value <= 100;
				break;
			case 'o2':
				inRange = value >= 90;
				break;
			case 'respirations':
				inRange = value >= 12 && value <= 20;
				break;

			default:
				break;
		}
		if (inRange) {
			event.target.classList.remove('abnormal');
		} else {
			event.target.classList.add('abnormal');
		}
	};

	function saveVitalSigns(formData) {
		// Don't save if everything is empty
		let fieldsWithValues = Array.from(formData.entries()).filter(
			([key, value]) => key !== 'vital-sign-mrn' && key !== 'editDate' && !!value
		);

		if (!fieldsWithValues.length) {
			return false;
		}

		const mrn = formData.get('vital-sign-mrn');
		const date = Number(formData.get('editDate')) || new Date().getTime();

		const vitalSigns = {
			date: date,
			bp: {
				sys: formData.get('bp-sys'),
				dia: formData.get('bp-dia'),
			},
			temp: formData.get('temperature'),
			pulse: formData.get('pulse'),
			o2: formData.get('o2'),
			resp: formData.get('respirations'),
			pain: formData.get('pain'),
			height: convertHeightToInches(formData.get('height-feet'), formData.get('height-inches')),
			weight: formData.get('weight'),
		};

		let vitalSignHistory = getVitalSigns(mrn);
		const editingIndex = vitalSignHistory?.findIndex((vs) => vs?.date === vitalSigns.date);

		if (editingIndex >= 0) {
			vitalSignHistory[editingIndex] = vitalSigns;
		} else {
			vitalSignHistory.push(vitalSigns);
		}
		// Only keep the last 3 histories
		vitalSignHistory = vitalSignHistory.slice(-3);

		const patient = patientService.getPatient(mrn) || {};
		patient.vitalSigns = vitalSignHistory;

		patientService.saveData(mrn, patient);

		return date;
	}

	/**
	 * Get the patient's vital signs history.
	 * First, try to get history from local storage. If that is not available, get
	 * history from the patientData object.
	 *
	 * @param {String} mrn
	 * @returns The patient's vital signs history array, or an empty array if no history is found.
	 */
	function getVitalSigns(mrn) {
		let vitalSigns = patientService.getData(mrn)?.vitalSigns;
		if (!vitalSigns?.length) {
			vitalSigns = patientService.getPatient(mrn)?.vitalSigns || [];
		}

		// Sort by date, oldest first
		vitalSigns.sort((a, b) => a.date - b.date);

		return vitalSigns;
	}

	function convertHeightToInches(feet, inches) {
		return Number(feet) * 12 + Number(inches) || null;
	}

	return {
		buildVitalSignsTable,
	};
})();
