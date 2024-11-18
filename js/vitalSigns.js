var vitalSignsController = (function () {
	let saveHandler;
	function buildVitalSignsTable(patient, options = {}) {
		const { editDate, savedDate } = options;

		// TODO: Disable 4th column inputs when editing
		// TODO: Save vital signs in order so we don't need to sort
		// Get saved vital signs
		let vitalSigns = [...patientService.vitalSigns.load(patient.mrn)]
			// Sort by date, oldest first
			.sort((a, b) => a.date - b.date)
			// Remove all but the last 3 vital signs
			?.slice(-3);

		const table = createElement({
			type: "table",
			classList: ["vs-table"],
			childNodes: [
				createColGroup(findVitalSignIndex(vitalSigns, savedDate)),
				createHead({ vitalSigns }),
				createBody(vitalSigns, { editingIndex: findVitalSignIndex(vitalSigns, editDate) }),
				createFooter(findVitalSignIndex(vitalSigns, editDate)),
			],
		});

		// Setup validation on vital-sign inputs
		table.querySelectorAll(".vital-sign-input input").forEach((input) => {
			input.addEventListener("blur", validateVitalSign);
			input.addEventListener("input", (event) => (event.target.value = event.target.value.replace(/\D/g, "")));
		});

		table.querySelectorAll(".vs-edit").forEach((input) => {
			input.addEventListener("click", (event) => {
				buildVitalSignsTable(patient, { editDate: Number(event.target.dataset?.date) });
			});
		});

		// TODO: Move form creation here? (Would elimated the need to remove listener)
		const form = document.getElementById("vital-sign-form");

		if (saveHandler) {
			form.removeEventListener("submit", saveHandler);
		}
		saveHandler = (event) => {
			handleSave(event, editDate);
		};

		form.addEventListener("submit", saveHandler);

		const mrnInput = document.createElement("input");
		mrnInput.type = "hidden";
		mrnInput.id = "vital-sign-mrn";
		mrnInput.name = "vital-sign-mrn";
		mrnInput.value = patient.mrn;

		document.getElementById("vs-form-content").replaceChildren(mrnInput, table);

		return table;
	}

	function createColGroup(saveIndex) {
		if (saveIndex < 0) {
			return null;
		}
		const group = createElement({ type: "colgroup" });
		group.insertAdjacentHTML(
			"beforeend",
			`<col span="${1 + saveIndex}">
            <col class="save-flash">`
		);

		// Remove the 'save-flash' class after the animation finishes
		const saveCol = group.lastChild;
		saveCol.addEventListener("animationend", () => saveCol.classList.remove("save-flash"), false);

		return group;
	}

	function createHead({ vitalSigns }) {
		const thead = createElement({ type: "thead" });
		const row = createElement({ type: "tr" });
		thead.appendChild(row);

		// Empty cell above Vital Sign lables
		row.appendChild(createElement({ type: "th" }));

		// TODO: Flag editing class?
		for (let i = 0; i < 3; i++) {
			const header = createElement({ type: "th" });
			const div = createElement({ type: "div" });
			const dateSpan = createElement({ type: "span", classList: ["vs-date"] });
			const timeSpan = createElement({ type: "span", classList: ["vs-time"] });

			div.insertAdjacentHTML(
				"beforeend",
				`<td>${getVitalSignForColumn({ vitalSigns, type: "date", columnIndex: i })}</td>`
			);

			header.appendChild(div);
			row.appendChild(header);
		}

		// The 'today' input column
		const header = createElement({ type: "th" });
		header.appendChild(
			createElement({
				type: "div",
				classList: ["vital-sign-input"],
				id: "vital-sign-today",
				childNodes: [document.createTextNode(new Date().toLocaleDateString())],
			})
		);
		row.appendChild(header);

		return thead;
	}

	function createBody(vitalSigns, options = {}) {
		const { editingIndex } = options;
		const body = createElement({ type: "tbody" });

		let vsTypes = ["bp", "temp", "pulse", "o2", "resp", "pain", "height", "weight"];

		vsTypes.forEach((type) => body.appendChild(createBodyRow(type, vitalSigns, editingIndex)));

		return body;
	}

	function createFooter(editingIndex) {
		const footer = createElement({ type: "tfoot" });
		const row = createElement({ type: "tr" });
		footer.appendChild(row);
		row.appendChild(createElement({ type: "td" })); // Empty cell below labels
		let saveButtonAdded = false;
		for (let i = 0; i < 4; i++) {
			const cell = createElement({ type: "td" });
			if (i === editingIndex || (i === 3 && !saveButtonAdded)) {
				saveButtonAdded = true;
				cell.insertAdjacentHTML(
					"beforeend",
					`<button type="submit" class="btn btn-green" id="vital-sign-save-btn">Save</button>`
				);
			}
			row.appendChild(cell);
		}
		return footer;
	}

	function createBodyRow(vitalSignType, vitalSigns, editingIndex) {
		/* TODO:
		 * - use for loop for all 4 columns (default to editing last column)
		 * - Always build input cell for last column
		 * - if last column != editingIndex, disable inputs and don't add name or id
		 */
		// TODO: Determine which column is the input
		const row = createElement({ type: "tr" });
		row.appendChild(
			createElement({
				type: "td",
				classList: ["vital-sign-label"],
				childNodes: [document.createTextNode(getVitalSignLabel(vitalSignType))],
			})
		);

		// TODO: Change input classes and add left+right padding
		for (let i = 0; i < 3; i++) {
			if (i === editingIndex) {
				row.appendChild(createInputCell(vitalSignType, vitalSigns[i]));
			} else {
				row.insertAdjacentHTML(
					"beforeend",
					`<td>${getVitalSignForColumn({ vitalSigns, type: vitalSignType, columnIndex: i })}</td>`
				);
			}
		}

		row.appendChild(createInputCell(vitalSignType));

		return row;
	}

	function createInputCell(vitalSignType, vitalSigns) {
		const cell = createElement({ type: "td" });
		const div = createElement({ type: "div", classList: ["vital-sign-input"] });
		const container = createElement({ type: "div", classList: ["vital-input-container"] });
		cell.appendChild(div);
		div.appendChild(container);

		let input = null;

		switch (vitalSignType) {
			case "bp":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="bp-sys" name="bp-sys" size="3" maxlength="3" inputmode="numeric" pattern="[0-9]{0,3}" value="${
						vitalSigns?.bp?.sys || ""
					}">
                    <span class="mx-2">/</span>
                    <input id="bp-dia" name="bp-dia" size="3" maxlength="3" value="${vitalSigns?.bp?.dia || ""}">
                    `
				);
				break;
			case "temp":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="temperature" name="temperature" maxlength="4" value="${vitalSigns?.temp || ""}">`
				);
				break;
			case "pulse":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="pulse" name="pulse" maxlength="3" value="${vitalSigns?.pulse || ""}">`
				);
				break;
			case "o2":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="o2" name="o2" maxlength="3" value="${vitalSigns?.o2 || ""}">`
				);
				break;
			case "resp":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="respirations" name="respirations" maxlength="3" value="${vitalSigns?.resp || ""}">`
				);
				break;
			case "pain":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="pain" name="pain" maxlength="2" value="${vitalSigns?.pain || ""}">`
				);
				break;
			case "height":
				let valueFeet = "";
				let valueInches = "";
				if (vitalSigns?.height) {
					valueFeet = Math.floor(vitalSigns.height / 12);
					valueInches = vitalSigns.height % 12;
				}
				container.insertAdjacentHTML(
					"beforeend",
					`
													<input id="height-feet" name="height-feet" size="3" maxlength="3" placeholder="feet" value="${valueFeet}">
													<span class="mx-2">/</span>
													<input id="height-inches" name="height-inches" size="3" maxlength="3" placeholder="inches" value="${valueInches}">
												`
				);
				break;
			case "weight":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="weight" name="weight" maxlength="3" value="${vitalSigns?.weight || ""}">`
				);
				break;
		}

		return cell;
	}

	function getVitalSignLabel(type) {
		let label = "";
		switch (type) {
			case "bp":
				label = "Blood Pressure";
				break;
			case "temp":
				label = "Temperature (F)";
				break;
			case "pulse":
				label = "Heart Rate";
				break;
			case "o2":
				label = "Oxygen Saturation";
				break;
			case "resp":
				label = "Respirations";
				break;
			case "pain":
				label = "Pain (0-10)";
				break;
			case "height":
				label = "Height";
				break;
			case "weight":
				label = "Weight (lbs)";
				break;
		}

		return label;
	}

	/**
	 * Get the vital sign value corresponding to the data type and
	 * format the data for display, if needed.
	 */
	function getVitalSignForColumn({ vitalSigns, type, columnIndex }) {
		if (!(vitalSigns?.length >= 3 - columnIndex)) {
			return "";
		}

		const vitalSign = vitalSigns[vitalSigns.length - 3 + columnIndex];

		let value = "";
		switch (type) {
			case "date":
				if (vitalSign.date) {
					const date = new Date(vitalSign.date);
					value = `
								<div>${date.toLocaleDateString()}
								<span class="vs-edit" title="Edit" data-date=${vitalSign.date}></span>
									<span class="vital-sign-history-time">${date.toTimeString().substring(0, 5)}</span>	
								</div>`;
				}
				break;
			case "bp":
				if (vitalSign.bp?.sys || vitalSign.bp?.dia) {
					value = `${vitalSign.bp.sys || ""}/${vitalSign.bp.dia || ""}`;
				}
				break;
			case "temp":
				value = vitalSign.temp;
				break;
			case "pulse":
				value = vitalSign.resp;
				break;
			case "height":
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

	function createElement({ type, classList, id, childNodes }) {
		const element = document.createElement(type);
		if (classList?.length) {
			setElementClass(element, classList);
		}
		if (id) {
			element.id = id;
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
	 * @param {Number} editDate
	 * @returns
	 */
	function findVitalSignIndex(vitalSignArray, editDate) {
		return vitalSignArray?.findIndex((vitalSigns) => vitalSigns?.date === editDate);
	}

	function handleSave(event, editDate) {
		event.preventDefault();

		const formData = new FormData(document.getElementById("vital-sign-form"));
		if (editDate) {
			formData.append("editDate", editDate);
		}
		let savedDate = patientService.vitalSigns.save(formData);

		if (!savedDate) {
			return;
		}

		const mrn = formData.get("vital-sign-mrn");
		buildVitalSignsTable(patientService.getPatient(mrn), { savedDate: savedDate });
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
				event.target.classList.remove("abnormal");
				return;
			}

			let inRange = true;

			switch (inputId) {
				case "bp-sys":
					inRange = value >= 90 && value <= 150;
					break;
				case "bp-dia":
					inRange = value >= 50 && value <= 90;
					break;
				case "temperature":
					inRange = value >= 97.6 && value <= 99.6;
					break;
				case "pulse":
					inRange = value >= 60 && value <= 100;
					break;
				case "o2":
					inRange = value >= 90;
					break;
				case "respirations":
					inRange = value >= 12 && value <= 20;
					break;

				default:
					break;
			}
			if (inRange) {
				event.target.classList.remove("abnormal");
			} else {
				event.target.classList.add("abnormal");
			}
		};

	return {
		buildVitalSignsTable,
	};
})();
