var vitalSignsController = (function () {
	function buildVitalSignsTable(patient) {
		// Get saved vital signs
		let vitalSigns = [...patientService.vitalSigns.load(patient.mrn)]
			// Sort by date, oldest first
			.sort((a, b) => a.date - b.date);

		// TODO: Use colgroup for save-flash
		//         <colgroup>
		//     <col span="3">
		//     <col class="save-flash">
		//   </colgroup>

		const table = createElement({
			type: "table",
			classList: ["vs-table"],
			childNodes: [createColGroup(), createHead({ vitalSigns }), createBody(vitalSigns)],
		});

		// Setup validation on vital-sign inputs
		table.querySelectorAll(".vital-sign-input input").forEach((input) => {
			input.addEventListener("blur", validateVitalSign);
			input.addEventListener("input", (event) => (event.target.value = event.target.value.replace(/\D/g, "")));
		});

		const mrnInput = document.createElement("input");
		mrnInput.type = "hidden";
		mrnInput.id = "vital-sign-mrn";
		mrnInput.name = "vital-sign-mrn";
		mrnInput.value = patient.mrn;

		document.getElementById("vs-form-content").replaceChildren(mrnInput, table);

		return table;
	}

	function createColGroup(saveIndex = 2) {
		if (!(saveIndex || saveIndex === 0)) {
			return null;
		}
		const group = createElement({ type: "colgroup" });
		group.insertAdjacentHTML(
			"beforeend",
			`<col span="${1 + saveIndex}">
            <col class="save-flash">`
		);
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

	function createBody(vitalSigns) {
		const body = createElement({ type: "tbody" });

		let vsTypes = ["bp", "temp", "pulse", "o2", "resp", "pain", "height", "weight"];

		vsTypes.forEach((type) => body.appendChild(createBodyRow(type, vitalSigns)));

		return body;
	}

	function createBodyRow(vitalSignType, vitalSigns) {
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
		let testEditingIndex = 3;
		for (let i = 0; i < 3; i++) {
			if (i === testEditingIndex) {
				row.appendChild(createInputCell(vitalSignType));
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

	function createInputCell(vitalSignType) {
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
					`<input id="bp-sys" name="bp-sys" size="3" maxlength="3" inputmode="numeric" pattern="[0-9]{0,3}">
                    <span class="mx-2">/</span>
                    <input id="bp-dia" name="bp-dia" size="3" maxlength="3" value="${""}">
                    `
				);
				break;
			case "temp":
				container.insertAdjacentHTML("beforeend", `<input id="temperature" name="temperature" maxlength="4">`);
				break;
			case "pulse":
				container.insertAdjacentHTML("beforeend", `<input id="pulse" name="pulse" maxlength="3">`);
				break;
			case "o2":
				container.insertAdjacentHTML("beforeend", `<input id="o2" name="o2" maxlength="3">`);
				break;
			case "resp":
				container.insertAdjacentHTML(
					"beforeend",
					`<input id="respirations" name="respirations" maxlength="3">`
				);
				break;
			case "pain":
				container.insertAdjacentHTML("beforeend", `<input id="pain" name="pain" maxlength="2">`);
				break;
			case "height":
				container.insertAdjacentHTML(
					"beforeend",
					`
													<input id="height-feet" name="height-feet" size="3" maxlength="3" placeholder="feet">
													<span class="mx-2">/</span>
													<input id="height-inches" name="height-inches" size="3" maxlength="3" placeholder="inches">
												`
				);
				break;
			case "weight":
				container.insertAdjacentHTML("beforeend", `<input id="weight" name="weight" maxlength="3">`);
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

	return {
		buildVitalSignsTable,
	};
})();
